import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allTeams = await prisma.team.findMany({
            include: {
                leader: {
                    select: { name: true, email: true, profileUrl: true }
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        points: true,
                        profileUrl: true
                    }
                },
                submissions: {
                    where: { isCorrect: true },
                    select: {
                        createdAt: true,
                        challenge: {
                            select: {
                                points: true,
                                theme: {
                                    select: { name: true }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
            }
        });

        const teams = allTeams.map((team: any) => {
            let cumulativeScore = 0;
            const categoryStats: Record<string, number> = {};

            const history = team.submissions.map((sub: any) => {
                cumulativeScore += sub.challenge.points;
                const theme = sub.challenge.theme?.name || 'Misc';
                categoryStats[theme] = (categoryStats[theme] || 0) + 1;

                return {
                    time: sub.createdAt,
                    score: cumulativeScore
                };
            });

            return {
                id: team.id,
                name: team.name,
                points: team.points, // Use points field directly from team table
                leader: team.leader,
                members: team.members,
                history,
                categoryStats,
                lastSolveAt: team.submissions.length > 0
                    ? team.submissions[team.submissions.length - 1].createdAt
                    : new Date(0)
            };
        });

        // Sort: Points DESC, then LastSolveAt ASC
        teams.sort((a: any, b: any) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            const timeA = new Date(a.lastSolveAt).getTime();
            const timeB = new Date(b.lastSolveAt).getTime();
            if (timeA === 0 && timeB === 0) return 0;
            if (timeA === 0) return 1;
            if (timeB === 0) return -1;
            return timeA - timeB;
        });

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

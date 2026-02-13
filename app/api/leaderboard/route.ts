import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this isn't cached statically at build time

export async function GET() {
    try {
        const cachedLeaderboard = await redis.get('leaderboard:data');
        if (cachedLeaderboard) {
            console.log('[CACHE HIT] Leaderboard fetched from Redis');
            return NextResponse.json(JSON.parse(cachedLeaderboard));
        }

        console.log('[CACHE MISS] Leaderboard fetching from DB');
        // Fetch ALL teams to ensure 0-point teams are visible
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
                                theme: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        // Map to the expected frontend structure
        const teams = allTeams.map((team: any) => {
            let cumulativeScore = 0;
            const categoryStats: Record<string, number> = {};

            const history = team.submissions.map((sub: any) => {
                cumulativeScore += sub.challenge.points;
                const theme = sub.challenge.theme || 'Misc';
                categoryStats[theme] = (categoryStats[theme] || 0) + 1;

                return {
                    time: sub.createdAt,
                    score: cumulativeScore
                };
            });

            return {
                id: team.id,
                name: team.name,
                points: team.points,
                leader: team.leader,
                members: team.members,
                history,
                categoryStats,
                lastSolveAt: team.submissions.length > 0
                    ? team.submissions[team.submissions.length - 1].createdAt
                    : new Date(0) // Epoch for teams with no solves
            };
        });

        // Sort: Points DESC, then LastSolveAt ASC
        teams.sort((a: any, b: any) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            // If points are tied, the one who solved earlier is ranked higher
            // Teams with 0 points will have lastSolveAt set to Epoch, so they will be at the bottom
            const timeA = new Date(a.lastSolveAt).getTime();
            const timeB = new Date(b.lastSolveAt).getTime();

            // If both have 0 points and 0 solves, they stay relative to each other
            if (timeA === 0 && timeB === 0) return 0;
            if (timeA === 0) return 1;
            if (timeB === 0) return -1;

            return timeA - timeB;
        });

        await redis.set('leaderboard:data', JSON.stringify(teams), 'EX', 5);

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

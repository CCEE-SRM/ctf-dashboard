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
        const leaderboardEntries = await prisma.leaderboard.findMany({
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        leader: {
                            select: { name: true, email: true, profileUrl: true }
                        },
                        submissions: {
                            where: { isCorrect: true },
                            select: {
                                createdAt: true,
                                challenge: {
                                    select: {
                                        points: true,
                                        theme: true // Need theme for category stats
                                    }
                                }
                            },
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            },
            orderBy: [
                { points: 'desc' },
                { lastSolveAt: 'asc' }
            ]
        });

        // Map to the expected frontend structure
        const teams = leaderboardEntries.map((entry: any) => {
            let cumulativeScore = 0;
            const categoryStats: Record<string, number> = {};

            const history = entry.team.submissions.map((sub: any) => {
                cumulativeScore += sub.challenge.points;
                const theme = sub.challenge.theme || 'Misc';
                categoryStats[theme] = (categoryStats[theme] || 0) + 1;

                return {
                    time: sub.createdAt,
                    score: cumulativeScore
                };
            });

            return {
                id: entry.team.id,
                name: entry.team.name,
                points: entry.points,
                leader: entry.team.leader,
                members: entry.memberDetails,
                history,
                categoryStats // Add this to the response
            };
        });

        await redis.set('leaderboard:data', JSON.stringify(teams), 'EX', 5);

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

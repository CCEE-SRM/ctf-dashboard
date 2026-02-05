import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this isn't cached statically at build time

export async function GET() {
    try {
        const cachedLeaderboard = await redis.get('leaderboard:data');
        if (cachedLeaderboard) {
            return NextResponse.json(JSON.parse(cachedLeaderboard));
        }

        const leaderboardEntries = await prisma.leaderboard.findMany({
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        leader: {
                            select: { name: true, email: true, profileUrl: true }
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
        const teams = leaderboardEntries.map((entry: typeof leaderboardEntries[0]) => ({
            id: entry.team.id,
            name: entry.team.name,
            points: entry.points,
            leader: entry.team.leader,
            members: entry.memberDetails,
        }));

        await redis.set('leaderboard:data', JSON.stringify(teams), 'EX', 5);

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

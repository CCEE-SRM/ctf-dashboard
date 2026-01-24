import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this isn't cached statically at build time

export async function GET() {
    try {
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
        const teams = leaderboardEntries.map(entry => ({
            id: entry.team.id,
            name: entry.team.name,
            points: entry.points,
            leader: entry.team.leader,
            members: entry.memberDetails
        }));

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse, NextRequest } from 'next/server';
import { getConfig } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const config = await getConfig();

        // 1. Get Top Team
        const topTeam = await prisma.team.findFirst({
            orderBy: { points: 'desc' },
            select: { name: true, points: true }
        });

        let myTeamStats = null;

        // 2. Check for optional auth to get current team rank
        const authHeader = req.headers.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split("Bearer ")[1];
            const decoded = verifyJwt(token);

            if (decoded) {
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    include: { team: true }
                });

                if (user?.team) {
                    // Get all teams ordered by points to calculate rank
                    // This is slightly heavy for every poll, but fine for a small CTF.
                    // A better way would be using a raw query or a dedicated leaderboard table.
                    const teams = await prisma.team.findMany({
                        orderBy: { points: 'desc' },
                        select: { id: true }
                    });
                    const rank = teams.findIndex(t => t.id === user.teamId) + 1;

                    myTeamStats = {
                        name: user.team.name,
                        points: user.team.points,
                        rank
                    };
                }
            }
        }

        // 3. Get Announcement Count
        const announcementCount = await prisma.announcement.count();

        return NextResponse.json({
            eventState: config.eventState,
            topTeam,
            myTeam: myTeamStats,
            announcementCount
        });
    } catch (error) {
        console.error('Status fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { adminOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';

export const POST = adminOnly(async (req: AuthenticatedRequest) => {
    try {
        console.log('[RESET] Initiating system-wide cleanup...');

        await prisma.$transaction(async (tx) => {
            // 1. Delete all Submissions
            await tx.submission.deleteMany({});
            console.log('[RESET] Submissions cleared');

            // 2. Delete all Hint Purchases (required to purge users/teams)
            // Note: The actual Hint definitions are NOT deleted.
            await tx.hintPurchase.deleteMany({});
            console.log('[RESET] Hint purchases cleared');

            // 3. Delete Leaderboard entries
            await tx.leaderboard.deleteMany({});
            console.log('[RESET] Leaderboard cleared');

            // 4. Delete Teams
            // Note: This might break User.teamId but won't delete users yet
            await tx.team.deleteMany({});
            console.log('[RESET] Teams cleared');

            // 5. Delete all non-staff Users
            await tx.user.deleteMany({
                where: {
                    role: 'USER'
                }
            });
            console.log('[RESET] Competitor user accounts cleared');

            // 6. Reset staff points to 0
            await tx.user.updateMany({
                data: {
                    points: 0
                }
            });
            console.log('[RESET] Staff points reset');
        });

        // 7. Clear Redis Caches
        const keysToClear = [
            'leaderboard:data',
            'challenges:list',
            'status:global'
        ];
        for (const key of keysToClear) {
            await redis.del(key);
        }
        console.log('[RESET] Cache purged');

        // Trigger real-time updates for any connected clients
        await redis.publish('ctf-triggers', JSON.stringify({
            leaderboard: true,
            challenges: true,
            status: true
        }));

        return NextResponse.json({
            success: true,
            message: 'System reset completed successfully. All competitor data has been purged.'
        });

    } catch (error) {
        console.error('[RESET] Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
});

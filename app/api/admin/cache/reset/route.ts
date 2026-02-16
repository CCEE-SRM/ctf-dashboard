import { redis } from '@/lib/redis';
import { adminOnly } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

export const DELETE = adminOnly(async () => {
    try {
        // Clear both cache keys
        await redis.del('challenges:list');
        await redis.del('leaderboard:data');

        console.log('[CACHE RESET] Admin manually cleared challenges:list and leaderboard:data');

        return NextResponse.json({
            success: true,
            message: 'Cache cleared successfully'
        });
    } catch (error) {
        console.error('Cache reset error:', error);
        return NextResponse.json({
            error: 'Failed to clear cache'
        }, { status: 500 });
    }
});

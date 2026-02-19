import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { staffOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const PUT = staffOnly(async (req: AuthenticatedRequest) => {
    try {
        const body = await req.json();
        const { themeIds } = body;

        if (!Array.isArray(themeIds)) {
            return NextResponse.json({ error: 'Invalid payload: themeIds must be an array' }, { status: 400 });
        }

        // Use transaction for consistency
        await prisma.$transaction(
            themeIds.map((id: string, index: number) =>
                prisma.theme.update({
                    where: { id },
                    data: { order: index }
                })
            )
        );

        // Invalidate Cache
        await redis.del('challenges:list');
        console.log('[CACHE INVALIDATE] Deleting challenges:list (Themes Reordered)');

        return NextResponse.json({ message: 'Themes reordered successfully' });

    } catch (error) {
        console.error('Reorder themes error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

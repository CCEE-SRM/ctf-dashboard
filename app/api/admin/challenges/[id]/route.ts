
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { adminOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

// PUT: Update an existing challenge
export const PUT = adminOnly(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const { id } = await params;
        const challengeId = id;
        const body = await req.json();

        // Destructure allowed fields to update
        const { title, description, theme, link, points, flag, visible, thumbnail, initialPoints } = body;

        // Verify challenge exists
        const existingChallenge = await prisma.challenge.findUnique({
            where: { id: challengeId }
        });

        if (!existingChallenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        const updatedChallenge = await prisma.challenge.update({
            where: { id: challengeId },
            data: {
                title,
                description,
                theme,
                link,
                points: points !== undefined ? Number(points) : undefined,
                initialPoints: initialPoints !== undefined ? Number(initialPoints) : undefined,
                flag,
                visible: visible !== undefined ? Boolean(visible) : undefined,
                thumbnail
            }
        });

        // Invalidate Cache
        await redis.del('challenges:list');
        console.log(`[CACHE INVALIDATE] Deleting challenges:list (Updated Challenge ${challengeId})`);

        return NextResponse.json({ message: 'Challenge updated successfully', challenge: updatedChallenge });

    } catch (error) {
        console.error('Update challenge error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

// DELETE: Remove a challenge
export const DELETE = adminOnly(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const { id } = await params;
        const challengeId = id;

        // Verify challenge exists
        const existingChallenge = await prisma.challenge.findUnique({
            where: { id: challengeId }
        });

        if (!existingChallenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        // Transaction to delete related submissions? 
        // Or just let cascade delete handle it if configured?
        // Prisma schema doesn't show onDelete cascade for submissions relation, so we should probably delete submissions first or rely on database constraints.
        // Let's assume we delete the challenge. If providing a foreign key constraint error, we'll need to handle it.
        // But for now, let's try direct deletion.

        // Actually, best practice to delete submissions first manually if not cascade
        await prisma.submission.deleteMany({
            where: { challengeId }
        });

        await prisma.challenge.delete({
            where: { id: challengeId }
        });

        // Invalidate Cache
        await redis.del('challenges:list');
        console.log(`[CACHE INVALIDATE] Deleting challenges:list (Deleted Challenge ${challengeId})`);

        return NextResponse.json({ message: 'Challenge deleted successfully' });

    } catch (error) {
        console.error('Delete challenge error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});


import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { staffOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

// PUT: Update an existing challenge
export const PUT = staffOnly(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const { id } = await params;
        const challengeId = id;
        const body = await req.json();

        // Destructure allowed fields to update
        const { title, description, themeId, link, points, flag, visible, thumbnail, initialPoints, fileType } = body;

        // Verify challenge exists
        const existingChallenge = await prisma.challenge.findUnique({
            where: { id: challengeId }
        });

        if (!existingChallenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        // Ownership Check: Creators can only edit their own challenges
        if (req.user.role === 'CHALLENGE_CREATOR' && existingChallenge.authorId !== req.user.userId) {
            return NextResponse.json({ error: 'Forbidden: You can only edit your own challenges' }, { status: 403 });
        }

        const updatedChallenge = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Updated basic fields
            const c = await tx.challenge.update({
                where: { id: challengeId },
                data: {
                    title,
                    description,
                    themeId,
                    link,
                    points: points !== undefined ? Number(points) : undefined,
                    initialPoints: initialPoints !== undefined ? Number(initialPoints) : (points !== undefined ? Number(points) : undefined),
                    flag,
                    visible: visible !== undefined ? Boolean(visible) : undefined,
                    thumbnail,
                    fileType: fileType ? (fileType as any) : undefined
                }
            });

            // Handle Hints if provided
            if (body.hints) {
                // 1. Find all existing purchases for hints of this challenge to refund
                const purchases = await tx.hintPurchase.findMany({
                    where: { hint: { challengeId } }
                });

                // 2. Refund points to Teams and Leaderboard
                for (const purchase of purchases) {
                    if (purchase.teamId) {
                        await tx.team.update({
                            where: { id: purchase.teamId },
                            data: { points: { increment: purchase.costAtPurchase } }
                        });

                        // Update leaderboard points if entry exists
                        await tx.leaderboard.updateMany({
                            where: { teamId: purchase.teamId },
                            data: { points: { increment: purchase.costAtPurchase } }
                        });
                    }
                }

                // 3. Delete existing purchases (fixes P2003)
                await tx.hintPurchase.deleteMany({
                    where: { hint: { challengeId } }
                });

                // 4. Delete existing hints
                await tx.hint.deleteMany({
                    where: { challengeId }
                });

                // 5. Create new ones
                if (body.hints.length > 0) {
                    await tx.hint.createMany({
                        data: body.hints.map((h: any) => ({
                            challengeId,
                            content: h.content,
                            cost: Number(h.cost)
                        }))
                    });
                }
            }

            return c;
        });

        return NextResponse.json({ message: 'Challenge updated successfully', challenge: updatedChallenge });

    } catch (error) {
        console.error('Update challenge error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

// DELETE: Remove a challenge
export const DELETE = staffOnly(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
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

        // Ownership Check: Creators can only delete their own challenges
        if (req.user.role === 'CHALLENGE_CREATOR' && existingChallenge.authorId !== req.user.userId) {
            return NextResponse.json({ error: 'Forbidden: You can only delete your own challenges' }, { status: 403 });
        }

        // 1. Transaction to cleanup everything safely
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // A. Refund Hint Purchases
            const purchases = await tx.hintPurchase.findMany({
                where: { hint: { challengeId } }
            });

            for (const purchase of purchases) {
                if (purchase.teamId) {
                    await tx.team.update({
                        where: { id: purchase.teamId },
                        data: { points: { increment: purchase.costAtPurchase } }
                    });

                    await tx.leaderboard.updateMany({
                        where: { teamId: purchase.teamId },
                        data: { points: { increment: purchase.costAtPurchase } }
                    });
                }
            }

            // B. Delete related data
            await tx.submission.deleteMany({ where: { challengeId } });
            await tx.hintPurchase.deleteMany({ where: { hint: { challengeId } } });
            await tx.hint.deleteMany({ where: { challengeId } });

            // C. Delete the challenge itself
            await tx.challenge.delete({
                where: { id: challengeId }
            });
        });

        return NextResponse.json({ message: 'Challenge deleted successfully' });

    } catch (error) {
        console.error('Delete challenge error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

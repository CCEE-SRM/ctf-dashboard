import { authenticated } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const POST = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const userId = req.user.userId;
        const body = await req.json();
        const { hintId } = body;

        if (!hintId) {
            return NextResponse.json({ error: 'Missing hintId' }, { status: 400 });
        }

        // 1. Get User and Team
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { team: true }
        });

        if (!user || !user.team) {
            return NextResponse.json({ error: 'User must belong to a team to buy hints' }, { status: 403 });
        }

        // 2. Get Hint details
        const hint = await prisma.hint.findUnique({
            where: { id: hintId }
        });

        if (!hint) {
            return NextResponse.json({ error: 'Hint not found' }, { status: 404 });
        }

        // 3. Check if already purchased
        const existingPurchase = await prisma.hintPurchase.findUnique({
            where: {
                teamId_hintId: {
                    teamId: user.team.id,
                    hintId: hint.id
                }
            }
        });

        if (existingPurchase) {
            return NextResponse.json({ message: 'Hint already purchased', content: hint.content });
        }

        // 4. Check if team has enough points
        if (user.team.points < hint.cost) {
            return NextResponse.json({ error: 'Insufficient team points' }, { status: 402 });
        }

        // 5. Transaction: Deduct points, create purchase
        const result = await prisma.$transaction(async (tx) => {
            // Deduct points from Team
            await tx.team.update({
                where: { id: user.team!.id },
                data: { points: { decrement: hint.cost } }
            });

            // Also deduct from Leaderboard for consistency? 
            // Usually leaderboard points reflect current score. Yes.
            // Check if leaderboard exists for team
            await tx.leaderboard.update({
                where: { teamId: user.team!.id },
                data: { points: { decrement: hint.cost } }
            });

            // Create Purchase Record
            const purchase = await tx.hintPurchase.create({
                data: {
                    userId: user.id,
                    teamId: user.team!.id,
                    hintId: hint.id,
                    costAtPurchase: hint.cost
                }
            });

            return purchase;
        });

        return NextResponse.json({
            message: 'Hint purchased successfully',
            content: hint.content,
            pointsRemaining: user.team.points - hint.cost
        });

    } catch (error) {
        console.error('Hint purchase error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
});

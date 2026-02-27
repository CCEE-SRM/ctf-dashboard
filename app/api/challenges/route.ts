import { prisma } from '@/lib/prisma';
import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getConfig } from '@/lib/config';

export const GET = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const userId = req.user.userId;

        // Fetch User to get Team ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true }
        });
        const teamId = user?.teamId;

        // Read Config
        const { dynamicScoring } = await getConfig();

        const problems = await prisma.challenge.findMany({
                where: {
                    visible: true
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    theme: {
                        select: { name: true }
                    },
                    fileType: true,
                    link: true,
                    thumbnail: true,
                    points: true,
                    initialPoints: true, // Needed for static mode
                    createdAt: true,
                    // Do NOT select 'flag'
                    hints: {
                        select: {
                            id: true,
                            cost: true,
                            content: true
                        }
                    },
                    author: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: [
                    { theme: { order: 'asc' } },
                    { createdAt: 'desc' }
                ]
            });

        // Get submissions for this user OR team to mark as solved
        const submissions = await prisma.submission.findMany({
            where: {
                isCorrect: true,
                OR: [
                    { userId },
                    ...(teamId ? [{ teamId }] : [])
                ]
            },
            select: {
                challengeId: true
            }
        });

        const solvedChallengeIds = new Set(submissions.map((s: { challengeId: string }) => s.challengeId));

        const challengesWithStatus = problems.map((p: any) => ({
            ...p,
            theme: p.theme?.name || 'Misc',
            points: dynamicScoring ? p.points : (p.initialPoints || p.points),
            solved: solvedChallengeIds.has(p.id)
        }));

        // Get Hint Purchases for this user's team
        const hintPurchases = await prisma.hintPurchase.findMany({
            where: {
                teamId: teamId
            },
            select: {
                hintId: true
            }
        });
        const purchasedHintIds = new Set(hintPurchases.map((hp: { hintId: string }) => hp.hintId));

        // Attach hints to challenges
        const challengesWithStatusAndHints = challengesWithStatus.map((c: any) => ({
            ...c,
            hints: (c.hints || []).map((h: any) => ({
                id: h.id,
                cost: h.cost,
                content: purchasedHintIds.has(h.id) ? h.content : undefined, // Mask content if not purchased
                purchased: purchasedHintIds.has(h.id)
            })).sort((a: any, b: any) => a.cost - b.cost)
        }));

        return NextResponse.json(challengesWithStatusAndHints);
    } catch (error) {
        console.error('Challenges fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

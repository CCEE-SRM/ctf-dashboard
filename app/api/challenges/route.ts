import { prisma } from '@/lib/prisma';
import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const userId = req.user.userId;

        // Fetch User to get Team ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true }
        });
        const teamId = user?.teamId;

        const problems = await prisma.challenge.findMany({
            where: {
                visible: true
            },
            select: {
                id: true,
                title: true,
                description: true,
                theme: true,
                link: true,
                thumbnail: true,
                points: true,
                createdAt: true,
                // Do NOT select 'flag'
            },
            orderBy: {
                createdAt: 'desc'
            }
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

        const solvedChallengeIds = new Set(submissions.map(s => s.challengeId));

        const challengesWithStatus = problems.map(p => ({
            ...p,
            solved: solvedChallengeIds.has(p.id)
        }));

        return NextResponse.json(challengesWithStatus);
    } catch (error) {
        console.error('Challenges fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

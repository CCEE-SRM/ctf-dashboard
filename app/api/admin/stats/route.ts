import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const GET = authenticated(async (req: AuthenticatedRequest) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const [
            totalTeams,
            totalUsers,
            totalCorrectSolves,
            challenges,
            correctSubmissions
        ] = await Promise.all([
            prisma.team.count(),
            prisma.user.count(),
            prisma.submission.count({ where: { isCorrect: true } }),
            prisma.challenge.findMany({
                select: {
                    id: true,
                    title: true,
                    _count: {
                        select: {
                            submissions: {
                                where: { isCorrect: true }
                            }
                        }
                    }
                }
            }),
            prisma.submission.findMany({
                where: { isCorrect: true },
                select: {
                    challengeId: true,
                    teamId: true
                }
            })
        ]);

        const totalChallenges = challenges.length;
        const solvedChallengesCount = challenges.filter(c => c._count.submissions > 0).length;
        const solveRate = totalChallenges > 0 ? (solvedChallengesCount / totalChallenges) * 100 : 0;

        // Find most solved challenge
        let mostSolved = "N/A";
        let maxSolves = 0;
        challenges.forEach(c => {
            if (c._count.submissions > maxSolves) {
                maxSolves = c._count.submissions;
                mostSolved = c.title;
            }
        });

        return NextResponse.json({
            totalTeams,
            totalUsers,
            totalCorrectSolves,
            challengesSolved: solvedChallengesCount,
            totalChallenges,
            solveRate: Math.round(solveRate),
            mostSolvedChallenge: mostSolved
        });
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

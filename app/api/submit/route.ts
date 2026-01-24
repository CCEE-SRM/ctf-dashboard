import { prisma } from '@/lib/prisma';
import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const POST = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const { challengeId, flag } = await req.json();
        const userId = req.user.userId;

        if (!challengeId || !flag) {
            return NextResponse.json({ error: 'Missing challengeId or flag' }, { status: 400 });
        }

        // Fetch User to get Team ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true }
        });

        const teamId = user?.teamId;

        // 1. Check if already solved by User OR Team
        const existingSubmission = await prisma.submission.findFirst({
            where: {
                challengeId,
                OR: [
                    { userId },
                    ...(teamId ? [{ teamId }] : [])
                ]
            }
        });

        if (existingSubmission) {
            return NextResponse.json({ error: 'You (or your team) have already solved this challenge!' }, { status: 400 });
        }

        // 2. Fetch Challenge
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId }
        });

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        // 3. Check Flag
        if (challenge.flag.trim() !== flag.trim()) {
            return NextResponse.json({ error: 'Incorrect Flag' }, { status: 400 });
        }

        // 4. Correct Flag Logic
        const submissionFingerprint = `${challengeId}-${teamId || userId}`;

        await prisma.$transaction(async (tx) => {
            // Check for existing fingerprint to give nice error before transaction (optional but friendly)
            // Actually, let's rely on catch or findUnique. 
            // Better to findFirst with the new logic if we want a specific error message logic before unique constraint hits.
            // But we already have step 1. Let's update step 1 to use fingerprint if possible, or just rely on DB logic. 
            // The step 1 existing logic is: 
            /*
             where: {
                challengeId,
                OR: [
                    { userId },
                    ...(teamId ? [{ teamId }] : [])
                ]
            }
            */
            // This logic is still correct for "finding if they solved it". 
            // BUT, to be safe, let's just create.

            // Create Submission
            await tx.submission.create({
                data: {
                    userId,
                    teamId: teamId || null,
                    challengeId,
                    submittedFlag: flag,
                    isCorrect: true,
                    submissionFingerprint
                }
            });

            // Update User Points
            await tx.user.update({
                where: { id: userId },
                data: {
                    points: { increment: challenge.points }
                }
            });

            // Update Team Points if user is in a team
            // Update Team Points and Leaderboard if user is in a team
            if (teamId) {
                const updatedTeam = await tx.team.update({
                    where: { id: teamId },
                    data: {
                        points: { increment: challenge.points }
                    },
                    include: {
                        members: {
                            select: { name: true, profileUrl: true, points: true, email: true }
                        }
                    }
                });

                // Upsert Leaderboard with new points, timestamp, and member snapshot
                await tx.leaderboard.upsert({
                    where: { teamId },
                    create: {
                        teamId,
                        points: updatedTeam.points,
                        lastSolveAt: new Date(),
                        memberDetails: updatedTeam.members as any // Cast to any for Json compatibility if needed, or Prisma handles object array
                    },
                    update: {
                        points: updatedTeam.points,
                        lastSolveAt: new Date(),
                        memberDetails: updatedTeam.members as any
                    }
                });
            }
        });

        return NextResponse.json({ success: true, message: `Correct! You earned ${challenge.points} points.` });

    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

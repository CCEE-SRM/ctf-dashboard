import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export const POST = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const { challengeId, flag } = await req.json();
        const userId = req.user.userId;

        if (!challengeId || !flag) {
            return NextResponse.json({ error: 'Missing challengeId or flag' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true }
        });

        const teamId = user?.teamId;

        // Enforce Team Membership
        if (!teamId) {
            return NextResponse.json({ error: 'You must be in a team to submit flags.' }, { status: 403 });
        }

        // Block submissions when event is not running
        const { dynamicScoring, eventState } = await getConfig();
        if (eventState !== 'START') {
            return NextResponse.json(
                { error: `Submissions are closed. The event is currently ${eventState === 'STOP' ? 'over' : 'paused'}.` },
                { status: 403 }
            );
        }

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

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

            // --- Scoring Logic ---
            // (eventState already validated above — event is START at this point)

            const initialPoints = challenge.initialPoints || challenge.points;

            let pointsToAward = initialPoints;
            let pointDiff = 0;

            if (dynamicScoring) {
                // Count total solves (including this new one)
                const solveCount = await tx.submission.count({
                    where: {
                        challengeId,
                        isCorrect: true
                    }
                });

                // Decay Formula: 3% decay per solve, max 25% decay
                const decayRate = 0.03;
                const maxDecay = 0.25;
                const decayFactor = Math.min(maxDecay, solveCount * decayRate);
                const newPoints = Math.floor(initialPoints * (1 - decayFactor));

                pointDiff = challenge.points - newPoints;
                pointsToAward = newPoints; // Theoretically correct for this user in dynamic mode?
                // Actually, in dynamic mode, EVERYONE gets the *new* lower score. 
                // So we award 'challenge.points' (old) then subtract diff from everyone?
                // OR we just award 'newPoints' and subtract diff from everyone else?
                // Existing logic: Update challenge -> Decrement Everyone -> Award User Old Points.
                // Net result for user: Old - Diff = New.

                if (pointDiff > 0) {
                    await tx.challenge.update({
                        where: { id: challengeId },
                        data: { points: newPoints }
                    });

                    // Update ALL users who solved this challenge
                    await tx.user.updateMany({
                        where: { submissions: { some: { challengeId, isCorrect: true } } },
                        data: { points: { decrement: pointDiff } }
                    });

                    // Update ALL teams who solved this challenge
                    await tx.team.updateMany({
                        where: { submissions: { some: { challengeId, isCorrect: true } } },
                        data: { points: { decrement: pointDiff } }
                    });

                    // Update Leaderboard
                    const affectedTeamIds = await tx.submission.findMany({
                        where: { challengeId, isCorrect: true, teamId: { not: null } },
                        select: { teamId: true },
                        distinct: ['teamId']
                    });

                    if (affectedTeamIds.length > 0) {
                        await tx.leaderboard.updateMany({
                            where: { teamId: { in: affectedTeamIds.map(t => t.teamId!) } },
                            data: { points: { decrement: pointDiff } }
                        });
                    }
                }

                // User gets the OLD points, which are then decremented by updateMany?
                // YES, if we follow the pattern: 
                // 1. Update Many (includes current user) -> Current User - Diff.
                // 2. Increment Current User + Old Points.
                // Result: -Diff + Old = New.
                pointsToAward = challenge.points;
            } else {
                // Static Mode: User gets Initial Points. No decay. No updates to others.
                pointsToAward = initialPoints;
            }

            // Grant Points to User
            await tx.user.update({
                where: { id: userId },
                data: {
                    points: { increment: pointsToAward }
                }
            });

            // Update Team Points if user is in a team
            if (teamId) {
                const updatedTeam = await tx.team.update({
                    where: { id: teamId },
                    data: {
                        points: { increment: pointsToAward }
                    },
                    include: {
                        members: {
                            select: { name: true, profileUrl: true, points: true, email: true }
                        }
                    }
                });

                await tx.leaderboard.upsert({
                    where: { teamId },
                    create: {
                        teamId,
                        points: updatedTeam.points,
                        lastSolveAt: new Date(),
                        memberDetails: updatedTeam.members as any
                    },
                    update: {
                        points: updatedTeam.points,
                        lastSolveAt: new Date(),
                        memberDetails: updatedTeam.members as any
                    }
                });
            }
            // Invalidate Leaderboard
            console.log('[DB UPDATE] Leaderboard updated');
            if (pointDiff > 0) {
                console.log('[DB UPDATE] Challenge points updated (Point Decay)');
            }
        });

        const finalChallenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
        return NextResponse.json({ success: true, message: `Correct! You earned ${finalChallenge?.points} points.` });

    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

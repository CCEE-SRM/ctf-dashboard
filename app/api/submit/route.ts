import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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

            // --- Dynamic Scoring Logic ---
            // Count total solves (including this new one)
            const solveCount = await tx.submission.count({
                where: {
                    challengeId,
                    isCorrect: true
                }
            });

            const initialPoints = challenge.initialPoints || challenge.points; // Fallback if initial not set
            // Decay Formula: 3% decay per solve, max 25% decay
            const decayRate = 0.03;
            const maxDecay = 0.25;
            const currentDecay = Math.min(maxDecay, (solveCount - 1) * decayRate); // -1 because first solve gets max points usually, OR strictly decays? 
            // User said: "if a person solve the problem reduct the point". 
            // Let's say solves=1 (this one). 3% decay? 
            // CTFd usually starts decaying AFTER the first solve or immediately? 
            // "reduct the point" implies connection. 
            // Let's use: count * 0.03.

            const decayFactor = Math.min(maxDecay, solveCount * decayRate);
            const newPoints = Math.floor(initialPoints * (1 - decayFactor));
            const pointMsg = newPoints;
            const pointDiff = challenge.points - newPoints;

            // Update Challenge Points if changed
            if (pointDiff > 0) {
                await tx.challenge.update({
                    where: { id: challengeId },
                    data: { points: newPoints }
                });

                // Decrement score for this user (who effectively got 'newPoints' but logic below adds 'challenge.points' so we decrement diff?)
                // Wait, standard logic:
                // 1. Give current user 'newPoints' (or 'challenge.points' and then subtract).
                // 2. Subtract 'pointDiff' from ALL solvers (including current one).

                // Let's do:
                // 1. Give this user the *old* points first (cache consistency).
                // 2. Subtract 'pointDiff' from ALL users who solved this challenge.

                // Update ALL users who solved this challenge
                await tx.user.updateMany({
                    where: { submissions: { some: { challengeId, isCorrect: true } } },
                    data: { points: { decrement: pointDiff } }
                });

                // Update ALL teams who solved this challenge
                // Problem: updateMany for Teams based on submissions relation might be tricky if relation is on User.
                // But we have Submission.teamId.
                await tx.team.updateMany({
                    where: { submissions: { some: { challengeId, isCorrect: true } } },
                    data: { points: { decrement: pointDiff } }
                });

                // Update Leaderboard
                // Leaderboard points = Team points. 
                // We can't use updateMany with join logic easily for Leaderboard -> Team relation in one go depending on provider.
                // But Leaderboard connects to Team.
                // Fetch affected teams first? Or just update Leaderboard where team -> submissions...
                // Prisma doesn't support deep relation filter in updateMany for some DBs.
                // Let's fetch affected TeamIDs.
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

            // Grant Points to User (The CURRENT value, likely the OLD value before decay if we processed logic order weirdly, 
            // BUT:
            // If I calculated NewPoints, and updated Challenge.
            // And I decremented everyone.
            // Does the new user get NewPoints?
            // "Update User Points" block below adds `challenge.points`. 
            // `challenge` variable holds the OLD points (fetched before transaction).
            // So: User gets OLD points. 
            // Then `updateMany` decrements OLD - NEW = Diff from EVERYONE (including just-added user).
            // Net result: User gets OLD - (OLD - NEW) = NEW points. 
            // Correct.

            await tx.user.update({
                where: { id: userId },
                data: {
                    points: { increment: challenge.points }
                }
            });

            // Update Team Points if user is in a team
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

                // Update Leaderboard entry for this specific team (redundant with updateMany above? 
                // No, this adds the base points for the *new* solution. The updateMany handled the *decay* for the *old* solutions + this one?
                // Wait.
                // Sequence:
                // 1. Solve Count = N.
                // 2. New Points calculated.
                // 3. Diff = Old - New.
                // 4. Update Challenge to New.
                // 5. Decrement Diff from ALL solvers (Users, Teams, Leaderboards).
                //    - This includes the current user/team because we just created the submission?
                //    - YES. `solveCount` included this submission. `submission` exists.
                //    - So `tx.user.updateMany` hits the current user too.
                //    - So current user starts with 0. Decrement Diff -> -Diff.
                // 6. Increment Current User/Team by Old Points.
                //    - User: -Diff + Old = - (Old - New) + Old = New.
                //    - Correct.

                await tx.leaderboard.upsert({
                    where: { teamId },
                    create: {
                        teamId,
                        points: updatedTeam.points, // slightly risky race condition if updateMany happened in parallel? Transaction handles it.
                        // Wait, `updatedTeam` is returned from `tx.team.update`.
                        // `tx.team.update` increments by `challenge.points` (OLD).
                        // Did `updatedTeam` see the decrement from `updateMany`?
                        // `updateMany` happened BEFORE `tx.team.update`.
                        // So `updatedTeam` has (Start - Diff + Old) = (Start + New).
                        // Correct.
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
        });

        const finalChallenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
        return NextResponse.json({ success: true, message: `Correct! You earned ${finalChallenge?.points} points.` });

    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

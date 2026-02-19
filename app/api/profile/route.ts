import { prisma } from '@/lib/prisma';
import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const GET = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const userId = req.user.userId;

        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                profileUrl: true,
                points: true,
                role: true,
                team: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        points: true,
                        members: {
                            select: {
                                id: true,
                                name: true,
                                profileUrl: true,
                                points: true
                            }
                        },
                        submissions: {
                            where: { isCorrect: true },
                            orderBy: { createdAt: 'desc' },
                            select: {
                                id: true,
                                createdAt: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                challenge: {
                                    select: {
                                        id: true,
                                        title: true,
                                        points: true,
                                        theme: { select: { name: true } }
                                    }
                                }
                            }
                        },
                        hintPurchases: {
                            orderBy: { createdAt: 'desc' },
                            select: {
                                id: true,
                                createdAt: true,
                                costAtPurchase: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                hint: {
                                    select: {
                                        challenge: {
                                            select: {
                                                title: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                submissions: {
                    where: { isCorrect: true },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        createdAt: true,
                        challenge: {
                            select: {
                                id: true,
                                title: true,
                                points: true,
                                theme: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!userProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Transform data for cleaner frontend consumption
        // Transform data for cleaner frontend consumption
        // Use Team Submissions if available, otherwise User Submissions (fallback for no-team users)
        const rawSolves = userProfile.team?.submissions || (userProfile.submissions.map(s => ({ ...s, user: { id: userProfile.id, name: userProfile.name } })));

        const solvedChallenges = rawSolves.map((sub: any) => ({
            id: sub.challenge.id,
            title: sub.challenge.title,
            points: sub.challenge.points,
            theme: sub.challenge.theme?.name || 'Misc',
            solvedAt: sub.createdAt,
            solvedBy: sub.user?.name || 'Unknown',
            solverId: sub.user?.id
        }));

        const hintPurchases = (userProfile.team?.hintPurchases || []).map((hp: any) => ({
            id: hp.id,
            challengeTitle: hp.hint.challenge.title,
            cost: hp.costAtPurchase,
            purchasedBy: hp.user?.name || 'Unknown',
            purchasedAt: hp.createdAt
        }));

        return NextResponse.json({
            user: {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                profileUrl: userProfile.profileUrl,
                points: userProfile.points,
                role: userProfile.role,
                team: userProfile.team ? {
                    id: userProfile.team.id,
                    name: userProfile.team.name,
                    code: userProfile.team.code,
                    points: userProfile.team.points,
                    members: userProfile.team.members
                } : null
            },
            solvedChallenges,
            hintPurchases
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

export const PUT = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const userId = req.user.userId;
        const { name } = await req.json();

        if (name !== undefined && (typeof name !== 'string' || name.length > 50)) {
            return NextResponse.json({ error: 'Invalid name format or length' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name: name || null },
            select: {
                id: true,
                name: true,
                email: true,
                profileUrl: true,
                points: true,
                role: true
            }
        });

        return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
        }

        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                leader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileUrl: true
                    }
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        points: true,
                        profileUrl: true,
                        role: true
                    },
                    orderBy: {
                        points: 'desc'
                    }
                },
                submissions: {
                    where: { isCorrect: true },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        challenge: {
                            select: {
                                id: true,
                                title: true,
                                points: true,
                                theme: true
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                hintPurchases: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        hint: {
                            select: {
                                id: true,
                                content: true,
                                cost: true,
                                challenge: {
                                    select: {
                                        id: true,
                                        title: true,
                                        theme: true
                                    }
                                }
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Calculate points breakdown
        const earnedFromSubmissions = team.submissions.reduce((sum, sub) => sum + sub.challenge.points, 0);
        const spentOnHints = team.hintPurchases.reduce((sum, hp) => sum + hp.costAtPurchase, 0);
        const calculatedPoints = earnedFromSubmissions - spentOnHints;

        // Calculate Category Stats
        const categoryStats: Record<string, number> = {};
        team.submissions.forEach(sub => {
            const themeName = sub.challenge.theme?.name || 'Misc';
            categoryStats[themeName] = (categoryStats[themeName] || 0) + 1;
        });

        // Format Response
        const teamProfile = {
            id: team.id,
            name: team.name,
            points: team.points,
            calculatedPoints,
            earnedFromSubmissions,
            spentOnHints,
            leader: team.leader,
            members: team.members.map(m => ({
                id: m.id,
                name: m.name,
                email: m.email,
                points: m.points,
                profileUrl: m.profileUrl,
                role: m.role
            })),
            solvedChallenges: team.submissions.map(sub => ({
                id: sub.challenge.id,
                title: sub.challenge.title,
                points: sub.challenge.points,
                theme: sub.challenge.theme?.name || 'Misc',
                solvedAt: sub.createdAt,
                solvedBy: {
                    id: sub.user.id,
                    name: sub.user.name
                }
            })),
            hintPurchases: team.hintPurchases.map(hp => ({
                id: hp.id,
                hintId: hp.hintId,
                cost: hp.costAtPurchase,
                purchasedAt: hp.createdAt,
                purchasedBy: {
                    id: hp.user.id,
                    name: hp.user.name
                },
                hint: {
                    content: hp.hint.content,
                    challengeId: hp.hint.challenge.id,
                    challengeTitle: hp.hint.challenge.title,
                    theme: hp.hint.challenge.theme?.name || 'Misc'
                }
            })),
            categoryStats
        };

        return NextResponse.json(teamProfile);

    } catch (error) {
        console.error('Fetch team profile error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { prisma } from '@/lib/prisma';
import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const GET = authenticated(async (req: AuthenticatedRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
        }

        const userProfile = await prisma.user.findUnique({
            where: { email },
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
                        points: true,
                        // code: false, // Ensure code is NOT selected
                        members: {
                            select: {
                                id: true,
                                name: true,
                                profileUrl: true,
                                points: true
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
                                theme: true
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
        const solvedChallenges = userProfile.submissions.map((sub: typeof userProfile.submissions[0]) => ({
            id: sub.challenge.id,
            title: sub.challenge.title,
            points: sub.challenge.points,
            theme: sub.challenge.theme,
            solvedAt: sub.createdAt
        }));

        return NextResponse.json({
            user: {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                profileUrl: userProfile.profileUrl,
                points: userProfile.points,
                role: userProfile.role,
                team: userProfile.team
            },
            solvedChallenges
        });

    } catch (error) {
        console.error('Public profile fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

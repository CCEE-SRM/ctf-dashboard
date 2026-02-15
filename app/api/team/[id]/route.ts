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
                }
            }
        });

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

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
            categoryStats
        };

        return NextResponse.json(teamProfile);

    } catch (error) {
        console.error('Fetch team profile error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

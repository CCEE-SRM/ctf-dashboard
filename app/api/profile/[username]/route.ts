import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> } // Check Next.js 15+ param handling
) {
    try {
        const { username } = await params;

        let user;

        // 1. Try finding by ID if it looks like a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);

        if (isUuid) {
            user = await prisma.user.findUnique({
                where: { id: username },
                include: {
                    team: true,
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
                            }
                        }
                    }
                }
            });
        }

        // 2. If not found by ID (or not UUID), try finding by Name
        if (!user) {
            // Decode username in case of spaces etc.
            const decodedName = decodeURIComponent(username);
            user = await prisma.user.findFirst({
                where: { name: decodedName },
                include: {
                    team: true,
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
                            }
                        }
                    }
                }
            });
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Construct Public Profile Object
        const publicProfile = {
            id: user.id,
            name: user.name,
            email: user.email, // Maybe hide email? Let's keep it for now or mask it.
            profileUrl: user.profileUrl,
            points: user.points,
            role: user.role,
            team: user.team ? {
                id: user.team.id,
                name: user.team.name,
                points: user.team.points
            } : null,
            solvedChallenges: user.submissions.map(sub => ({
                id: sub.challenge.id,
                title: sub.challenge.title,
                points: sub.challenge.points,
                theme: sub.challenge.theme,
                solvedAt: sub.createdAt
            }))
        };

        return NextResponse.json(publicProfile);

    } catch (error) {
        console.error('Fetch public profile error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

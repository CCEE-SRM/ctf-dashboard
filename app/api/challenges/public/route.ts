import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { publicChallenges, dynamicScoring } = await getConfig();

        if (!publicChallenges) {
            return NextResponse.json({ error: 'Public access to challenges is disabled.' }, { status: 403 });
        }

        const cachedChallenges = await redis.get('challenges:list');
        let problems;

        if (cachedChallenges) {
            problems = JSON.parse(cachedChallenges);
        } else {
            problems = await prisma.challenge.findMany({
                where: { visible: true },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    theme: { select: { name: true } },
                    fileType: true,
                    link: true,
                    thumbnail: true,
                    points: true,
                    initialPoints: true,
                    createdAt: true,
                    hints: {
                        select: {
                            id: true,
                            cost: true
                        }
                    },
                    author: {
                        select: { name: true }
                    }
                },
                orderBy: [
                    { theme: { order: 'asc' } },
                    { createdAt: 'desc' }
                ]
            });
            await redis.set('challenges:list', JSON.stringify(problems));
        }

        // Map challenges for public view (No solved status, masked hints)
        const publicChallengesList = problems.map((p: any) => ({
            ...p,
            theme: p.theme?.name || 'Misc',
            points: dynamicScoring ? p.points : (p.initialPoints || p.points),
            solved: false,
            hints: (p.hints || []).map((h: any) => ({
                id: h.id,
                cost: h.cost,
                purchased: false
                // content is omitted
            })).sort((a: any, b: any) => a.cost - b.cost)
        }));

        return NextResponse.json(publicChallengesList);
    } catch (error) {
        console.error('Public Challenges fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

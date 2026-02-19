import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { staffOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const GET = staffOnly(async () => {
    try {
        const challenges = await prisma.challenge.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                hints: true,
                theme: true
            }
        });
        return NextResponse.json(challenges);
    } catch (error) {
        console.error('Admin Fetch Challenges Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

export const POST = staffOnly(async (req: AuthenticatedRequest) => {
    try {
        const body = await req.json();
        const { title, description, themeId, link, points, flag, thumbnail, fileType } = body;

        // Basic Validation
        if (!title || !description || !themeId || !flag || points === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const challenge = await prisma.challenge.create({
            data: {
                title,
                description,
                themeId,
                link: link || null,
                thumbnail: thumbnail || null,
                points: Number(points),
                initialPoints: Number(points),
                flag,
                fileType: fileType || 'CHALLENGE',
                authorId: req.user.userId,
                hints: {
                    create: (body.hints || []).map((h: any) => ({
                        content: h.content,
                        cost: Number(h.cost)
                    }))
                }
            }
        });

        await redis.del('challenges:list');
        console.log('[CACHE INVALIDATE] Deleting challenges:list (New Challenge)');

        return NextResponse.json({ message: 'Challenge created successfully', challenge }, { status: 201 });

    } catch (error) {
        console.error('Create challenge error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

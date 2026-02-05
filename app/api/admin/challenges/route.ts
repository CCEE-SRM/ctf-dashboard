import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { adminOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const POST = adminOnly(async (req: AuthenticatedRequest) => {
    try {
        const body = await req.json();
        const { title, description, theme, link, points, flag, thumbnail } = body;

        // Basic Validation
        if (!title || !description || !theme || !flag || points === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const challenge = await prisma.challenge.create({
            data: {
                title,
                description,
                theme,
                link: link || null,
                thumbnail: thumbnail || null,
                points: Number(points),
                initialPoints: Number(points),
                flag
            }
        });

        await redis.del('challenges:list');

        return NextResponse.json({ message: 'Challenge created successfully', challenge }, { status: 201 });

    } catch (error) {
        console.error('Create challenge error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

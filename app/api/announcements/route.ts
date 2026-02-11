
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

// GET /api/announcements - Fetch all announcements (public)
export async function GET() {
    try {
        // 1. Check Redis Cache
        const cached = await redis.get('announcements:list');
        if (cached) {
            console.log('[CACHE HIT] Serving announcements from Redis');
            return NextResponse.json(JSON.parse(cached));
        }

        // 2. Fetch from DB if miss
        const announcements = await prisma.announcement.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                author: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // 3. Cache in Redis (TTL: 1 hour)
        await redis.set('announcements:list', JSON.stringify(announcements), 'EX', 3600);
        console.log('[CACHE MISS] Cached announcements in Redis');

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Failed to fetch announcements:", error);
        return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
    }
}

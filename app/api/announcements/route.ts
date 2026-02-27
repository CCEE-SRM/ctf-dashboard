
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/announcements - Fetch all announcements (public)
export async function GET() {
    try {
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

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Failed to fetch announcements:", error);
        return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
    }
}

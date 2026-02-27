
import { adminOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// POST /api/admin/announcements - Create an announcement (Admin only)
export const POST = adminOnly(async (req: AuthenticatedRequest) => {
    try {
        const { title, content } = await req.json();
        const userId = req.user.userId;

        if (!title || !content) {
            return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                authorId: userId,
            },
        });


        return NextResponse.json(announcement);
    } catch (error) {
        console.error("Failed to create announcement:", error);
        return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
    }
});

// DELETE /api/admin/announcements - Delete an announcement (Admin only)
// Expects query param ?id=...
export const DELETE = adminOnly(async (req: AuthenticatedRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing announcement ID" }, { status: 400 });
        }

        await prisma.announcement.delete({
            where: { id },
        });


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete announcement:", error);
        return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
    }
});

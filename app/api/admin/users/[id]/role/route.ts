import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const PATCH = authenticated(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = params;
        const body = await req.json().catch(() => ({}));
        const { role } = body;

        if (!role || !Object.values(Role).includes(role as Role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Security: Prevent self-demotion
        if (id === req.user.userId && role === Role.USER) {
            return NextResponse.json({ error: 'Self-demotion is not allowed' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role: role as Role },
            select: {
                id: true,
                email: true,
                role: true,
                name: true
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Failed to update user role:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

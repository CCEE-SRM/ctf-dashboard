import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const GET = authenticated(async (req: AuthenticatedRequest) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            include: {
                team: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                email: 'asc'
            }
        });

        // Map to a cleaner format
        const formattedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            teamName: user.team?.name || null,
            profileUrl: user.profileUrl
        }));

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

export const POST = authenticated(async (req: AuthenticatedRequest) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { email, role = 'ADMIN' } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        const validRoles = ['ADMIN', 'CHALLENGE_CREATOR'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (user) {
            // Update to specific role
            user = await prisma.user.update({
                where: { email: normalizedEmail },
                data: { role: role as 'ADMIN' | 'CHALLENGE_CREATOR' }
            });
        } else {
            // Create as specific role
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    role: role as 'ADMIN' | 'CHALLENGE_CREATOR',
                    name: email.split('@')[0] // Default name from email
                }
            });
        }

        return NextResponse.json({ message: 'User added successfully', user });
    } catch (error) {
        console.error('Failed to add admin:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

// For Demotion or general role updates (alternative to the dynamic route if preferred)
export const PATCH = authenticated(async (req: AuthenticatedRequest) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
        }

        if (userId === req.user.userId && role === 'USER') {
            return NextResponse.json({ error: 'Self-demotion is not allowed' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role: role as 'USER' | 'ADMIN' | 'CHALLENGE_CREATOR' }
        });

        return NextResponse.json({ message: 'Role updated', user: updated });
    } catch (error) {
        console.error('Failed to update role:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

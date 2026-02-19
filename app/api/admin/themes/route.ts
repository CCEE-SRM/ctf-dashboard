import { prisma } from '@/lib/prisma';
import { staffOnly } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

export const GET = staffOnly(async () => {
    try {
        const themes = await prisma.theme.findMany({
            orderBy: { order: 'asc' }
        });
        return NextResponse.json(themes);
    } catch (error) {
        console.error('Fetch Themes Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

export const POST = staffOnly(async (req: AuthenticatedRequest) => {
    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
        }

        const lastTheme = await prisma.theme.findFirst({
            orderBy: { order: 'desc' }
        });
        const nextOrder = lastTheme ? lastTheme.order + 1 : 0;

        const theme = await prisma.theme.create({
            data: {
                name,
                order: nextOrder
            }
        });

        return NextResponse.json({ message: 'Theme created successfully', theme }, { status: 201 });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Theme already exists' }, { status: 409 });
        }
        console.error('Create theme error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

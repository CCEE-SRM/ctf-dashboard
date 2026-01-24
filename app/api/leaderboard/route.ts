import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this isn't cached statically at build time

export async function GET() {
    try {
        const teams = await prisma.team.findMany({
            include: {
                leader: {
                    select: { name: true, email: true, profileUrl: true }
                },
                members: {
                    select: { name: true, points: true, email: true, profileUrl: true }
                }
            },
            orderBy: {
                points: 'desc'
            }
        });

        return NextResponse.json(teams);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

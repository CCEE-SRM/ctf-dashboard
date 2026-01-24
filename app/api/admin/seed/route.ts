import { adminOnly } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';

interface SeedMember {
    email: string;
    name: string;
}

interface SeedTeam {
    name: string;
    members: SeedMember[];
    leaderEmail: string;
}

export const POST = adminOnly(async (req: AuthenticatedRequest) => {
    try {
        const body = await req.json() as SeedTeam[];

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Body must be an array of teams' }, { status: 400 });
        }

        const results = [];

        for (const teamData of body) {
            // 1. Upsert Leader First (Need ID for Team creation if strictly enforcing relations, 
            // but simpler: Upsert all members first, then create team, then connect)

            // Let's create all members (users) first
            const memberEmails = teamData.members.map(m => m.email);
            // Ensure leader is in members list implicitly or explicitly is fine, 
            // but let's upsert everyone in the members list.

            for (const member of teamData.members) {
                await prisma.user.upsert({
                    where: { email: member.email },
                    update: { name: member.name },
                    create: { email: member.email, name: member.name, role: 'USER' }
                });
            }

            // Upsert Leader specifically to ensure they exist if not in members list
            const leader = await prisma.user.findUnique({ where: { email: teamData.leaderEmail } });
            if (!leader) {
                // If leader not found (and not in members), create them? 
                // Assuming payload includes leader in members or we fail. 
                // Let's be robust: create if missing.
                await prisma.user.create({
                    data: { email: teamData.leaderEmail, name: "Team Leader", role: 'USER' }
                });
            }

            // 2. Create/Update Team
            // We use upsert on leaderId if we wanted strict 1-1, but Team doesn't have unique name constraint in schema.
            // Let's assume we create new Team or update existing by Leader? 
            // Schema says: leaderId is @unique. So one leader one team.

            const leaderRecord = await prisma.user.findUniqueOrThrow({ where: { email: teamData.leaderEmail } });

            const allMemberEmails = Array.from(new Set([...memberEmails, teamData.leaderEmail]));

            const team = await prisma.team.upsert({
                where: { leaderId: leaderRecord.id },
                update: {
                    name: teamData.name,
                    members: {
                        connect: allMemberEmails.map(email => ({ email }))
                    }
                },
                create: {
                    name: teamData.name,
                    leader: { connect: { id: leaderRecord.id } },
                    members: {
                        connect: allMemberEmails.map(email => ({ email }))
                    }
                }
            });

            results.push(team);
        }

        return NextResponse.json({ message: 'Seed successful', teamsCreated: results.length });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
});

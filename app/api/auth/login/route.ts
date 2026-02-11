import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/jwt';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

        if (!apiKey) {
            console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        // Parse Body for extra params
        const body = await request.json().catch(() => ({}));
        const { mode, teamName, teamCode } = body;

        // 1. Verify Token via Google Identity Toolkit REST API
        const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });

        const googleData = await googleRes.json();
        if (!googleRes.ok || !googleData.users || googleData.users.length === 0) {
            console.error("Token verification failed:", googleData);
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const firebaseUser = googleData.users[0];
        const { email, localId, displayName, photoUrl } = firebaseUser;

        if (!email) {
            return NextResponse.json({ error: 'Email is required in token' }, { status: 400 });
        }

        // 2. Check if User Exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { team: true }
        });

        // 3. Handle Registration / Login Logic
        if (!user) {
            // New User - Requires Team Registration or Join
            if (!mode) {
                return NextResponse.json({ error: 'User not found. Please Register or Join a Team.', requiresRegistration: true }, { status: 404 });
            }

            // Determine Role (Based on ADMIN_EMAIL env)
            const adminEmail = process.env.ADMIN_EMAIL;
            const initialRole: Role = (adminEmail && email === adminEmail) ? Role.ADMIN : Role.USER;

            if (mode === 'REGISTER') {
                if (!teamName || teamName.trim().length < 3) {
                    return NextResponse.json({ error: 'Team name is required (min 3 chars)' }, { status: 400 });
                }

                // Generate 4-digit code
                const code = Math.floor(1000 + Math.random() * 9000).toString();

                // Transaction: Create User -> Create Team -> Link User as Leader
                // Note: Cyclic dependency (Team needs Leader, User needs Team).
                // Solution: Create User first, Create Team, Update User.

                try {
                    await prisma.$transaction(async (tx) => {
                        // 1. Create User
                        const newUser = await tx.user.create({
                            data: {
                                email,
                                name: displayName || null,
                                profileUrl: photoUrl || null,
                                role: initialRole,
                            }
                        });

                        // 2. Create Team
                        const newTeam = await tx.team.create({
                            data: {
                                name: teamName,
                                code: code,
                                leaderId: newUser.id,
                                members: {
                                    connect: { id: newUser.id }
                                }
                            }
                        });

                        // Refetch user with team
                        user = await tx.user.findUnique({
                            where: { id: newUser.id },
                            include: { team: true }
                        });
                    });
                } catch (e: any) {
                    if (e.code === 'P2002') { // Unique constraint violation
                        return NextResponse.json({ error: 'Team name or code already exists. Try again.' }, { status: 409 });
                    }
                    throw e;
                }

            } else if (mode === 'JOIN') {
                if (!teamCode || teamCode.length !== 4) {
                    return NextResponse.json({ error: 'Valid 4-digit Team Code is required' }, { status: 400 });
                }

                const team = await prisma.team.findUnique({
                    where: { code: teamCode }
                });

                if (!team) {
                    return NextResponse.json({ error: 'Team not found with this code' }, { status: 404 });
                }

                // Create User and Link to Team
                user = await prisma.user.create({
                    data: {
                        email,
                        name: displayName || null,
                        profileUrl: photoUrl || null,
                        role: initialRole,
                        team: {
                            connect: { id: team.id }
                        }
                    },
                    include: { team: true }
                });
            } else {
                return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
            }
        } else {
            // User exists - just update profile info if needed (optional) and log in
            // We can skip profile update for speed or do it asynchronously
        }

        if (!user) {
            return NextResponse.json({ error: 'Login failed' }, { status: 500 });
        }

        // 4. Generate Custom JWT
        const token = signJwt({
            userId: String(user.id),
            email: user.email,
            role: user.role,
        });

        return NextResponse.json({ user, token });
    } catch (error) {
        console.error('Error in login:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

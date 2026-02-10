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

        // 2. Check and Update User
        // 2. Check and Update User
        // Check if this is the first user to make them ADMIN
        const userCount = await prisma.user.count();
        // If user count is 0, this will be the first user, so make them ADMIN.
        // Note: If the user already exists, this 'role' variable won't be used in the 'create' block, so their existing role validates.
        // However, if we are upserting an existing user, count is at least 1.
        // Actually, better logic: If we are creating, checks count.

        // Let's use a simpler heuristic for the role in 'create': 
        // We can't easily know if 'upsert' is creating or updating without checking first or checking result.
        // But we only care about 'role' in 'create'.
        // If the DB is empty, userCount is 0. We want role='ADMIN'.
        // If the DB has users, userCount > 0. We want role='USER'.

        const initialRole: Role = userCount === 0 ? Role.ADMIN : Role.USER;

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name: displayName || null,
                profileUrl: photoUrl || null,
            },
            create: {
                email,
                name: displayName || null,
                profileUrl: photoUrl || null,
                role: initialRole,
            },
        });

        // 3. Generate Custom JWT
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

import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/jwt';
import { NextResponse } from 'next/server';

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
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (!existingUser) {
            return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
        }

        const user = await prisma.user.update({
            where: { email },
            data: {
                name: displayName || null,
                profileUrl: photoUrl || null,
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

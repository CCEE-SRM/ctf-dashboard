import { adminOnly } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

export const DELETE = adminOnly(async () => {
    return NextResponse.json({
        success: true,
        message: 'Cache is not in use (Redis removed)'
    });
});

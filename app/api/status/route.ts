import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = await getConfig();
        return NextResponse.json({ eventState: config.eventState });
    } catch (error) {
        console.error('Status fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

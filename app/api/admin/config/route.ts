import { authenticated } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/types/auth';
import { NextResponse } from 'next/server';
import { getConfig, updateConfig } from '@/lib/config';

export const GET = authenticated(async (req: AuthenticatedRequest) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const config = await getConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Config fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

export const POST = authenticated(async (req: AuthenticatedRequest) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { dynamicScoring, eventState, publicChallenges, publicLeaderboard } = body;

        const filteredUpdate: any = {};

        if (dynamicScoring !== undefined) {
            if (typeof dynamicScoring !== 'boolean') {
                return NextResponse.json({ error: 'Invalid config: dynamicScoring must be boolean' }, { status: 400 });
            }
            filteredUpdate.dynamicScoring = dynamicScoring;
        }

        if (eventState !== undefined) {
            if (!['START', 'PAUSE', 'STOP'].includes(eventState)) {
                return NextResponse.json({ error: 'Invalid config: eventState must be START, PAUSE, or STOP' }, { status: 400 });
            }
            filteredUpdate.eventState = eventState;
        }

        if (publicChallenges !== undefined) {
            filteredUpdate.publicChallenges = !!publicChallenges;
        }

        if (publicLeaderboard !== undefined) {
            filteredUpdate.publicLeaderboard = !!publicLeaderboard;
        }

        const { rateLimit } = body;
        if (rateLimit) {
            filteredUpdate.rateLimit = {
                maxAttempts: typeof rateLimit.maxAttempts === 'number' ? rateLimit.maxAttempts : 3,
                windowSeconds: typeof rateLimit.windowSeconds === 'number' ? rateLimit.windowSeconds : 30,
                cooldownSeconds: typeof rateLimit.cooldownSeconds === 'number' ? rateLimit.cooldownSeconds : 60
            };
        }

        const updated = await updateConfig(filteredUpdate);
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Config update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

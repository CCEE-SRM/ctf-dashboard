// lib/config.ts
import { redis } from './redis';

export interface AppConfig {
    dynamicScoring: boolean;
    eventState: 'START' | 'PAUSE' | 'STOP';
    rateLimit: {
        maxAttempts: number;
        windowSeconds: number;
        cooldownSeconds: number;
    };
    publicChallenges: boolean;
    publicLeaderboard: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
    dynamicScoring: false,
    eventState: 'START',
    rateLimit: {
        maxAttempts: 3,
        windowSeconds: 30,
        cooldownSeconds: 60
    },
    publicChallenges: true,
    publicLeaderboard: true
};

const REDIS_CONFIG_KEY = 'config:app';

export async function getConfig(): Promise<AppConfig> {
    // 1. Get base config from Environment Variables (Static defaults)
    const dynamicScoring = process.env.DYNAMIC_SCORING === 'true' || DEFAULT_CONFIG.dynamicScoring;
    const envEventState = (process.env.EVENT_STATE as any) || DEFAULT_CONFIG.eventState;

    // Validate eventState from environment
    const validStates = ['START', 'PAUSE', 'STOP'];
    const finalEnvEventState = validStates.includes(envEventState) ? envEventState : DEFAULT_CONFIG.eventState;

    const baseConfig: AppConfig = {
        dynamicScoring,
        eventState: finalEnvEventState,
        rateLimit: {
            maxAttempts: Number(process.env.RATE_LIMIT_MAX_ATTEMPTS) || DEFAULT_CONFIG.rateLimit.maxAttempts,
            windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || DEFAULT_CONFIG.rateLimit.windowSeconds,
            cooldownSeconds: Number(process.env.RATE_LIMIT_COOLDOWN_SECONDS) || DEFAULT_CONFIG.rateLimit.cooldownSeconds,
        },
        publicChallenges: process.env.PUBLIC_CHALLENGES === 'false' ? false : (process.env.PUBLIC_CHALLENGES === 'true' ? true : DEFAULT_CONFIG.publicChallenges),
        publicLeaderboard: process.env.PUBLIC_LEADERBOARD === 'false' ? false : (process.env.PUBLIC_LEADERBOARD === 'true' ? true : DEFAULT_CONFIG.publicLeaderboard),
    };

    // 2. Try to fetch overrides from Redis
    try {
        const cached = await redis.get(REDIS_CONFIG_KEY);
        if (cached) {
            const overrides = JSON.parse(cached);
            // Apply validation for eventState from Redis overrides
            const overrideEventState = validStates.includes(overrides.eventState) ? overrides.eventState : baseConfig.eventState;

            return {
                ...baseConfig,
                ...overrides,
                eventState: overrideEventState, // Use validated override or base
                rateLimit: {
                    ...baseConfig.rateLimit,
                    ...(overrides.rateLimit || {})
                }
            };
        }
    } catch (error) {
        console.error('Failed to fetch config from Redis, using ENV defaults', error);
    }

    return baseConfig;
}

export async function updateConfig(newConfig: Partial<AppConfig>): Promise<AppConfig> {
    try {
        const currentConfig = await getConfig();

        // Validate newConfig.eventState if provided
        let validatedNewConfig = { ...newConfig };
        if (newConfig.eventState) {
            const validStates = ['START', 'PAUSE', 'STOP'];
            if (!validStates.includes(newConfig.eventState)) {
                console.warn(`Invalid eventState '${newConfig.eventState}' provided. Keeping current state.`);
                delete validatedNewConfig.eventState; // Remove invalid state to prevent it from being applied
            }
        }

        const updatedConfig = {
            ...currentConfig,
            ...validatedNewConfig,
            rateLimit: {
                ...currentConfig.rateLimit,
                ...(validatedNewConfig.rateLimit || {})
            }
        };

        // Save to Redis
        await redis.set(REDIS_CONFIG_KEY, JSON.stringify(updatedConfig));

        console.log('[CONFIG] Application configuration updated in Redis');
        return updatedConfig;
    } catch (error) {
        console.error('Failed to update config in Redis', error);
        throw error;
    }
}

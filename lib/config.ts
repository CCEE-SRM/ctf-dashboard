// lib/config.ts

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

        // Note: config updates are in-memory only (no Redis persistence)
        console.log('[CONFIG] Application configuration updated (in-memory)');
        return updatedConfig;
    } catch (error) {
        console.error('Failed to update config', error);
        throw error;
    }
}

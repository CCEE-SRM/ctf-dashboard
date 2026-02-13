// lib/config.ts
export interface AppConfig {
    dynamicScoring: boolean;
    eventState: 'START' | 'PAUSE' | 'STOP';
    rateLimit: {
        maxAttempts: number;
        windowSeconds: number;
        cooldownSeconds: number;
    };
}

const DEFAULT_CONFIG: AppConfig = {
    dynamicScoring: false,
    eventState: 'START',
    rateLimit: {
        maxAttempts: 3,
        windowSeconds: 30,
        cooldownSeconds: 60
    }
};

export async function getConfig(): Promise<AppConfig> {
    const dynamicScoring = process.env.DYNAMIC_SCORING === 'true' || DEFAULT_CONFIG.dynamicScoring;
    const eventState = (process.env.EVENT_STATE as any) || DEFAULT_CONFIG.eventState;

    // Validate eventState
    const validStates = ['START', 'PAUSE', 'STOP'];
    const finalEventState = validStates.includes(eventState) ? eventState : DEFAULT_CONFIG.eventState;

    return {
        dynamicScoring,
        eventState: finalEventState,
        rateLimit: {
            maxAttempts: Number(process.env.RATE_LIMIT_MAX_ATTEMPTS) || DEFAULT_CONFIG.rateLimit.maxAttempts,
            windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || DEFAULT_CONFIG.rateLimit.windowSeconds,
            cooldownSeconds: Number(process.env.RATE_LIMIT_COOLDOWN_SECONDS) || DEFAULT_CONFIG.rateLimit.cooldownSeconds,
        }
    };
}

// Since we are moving to ENV variables, runtime updates via the API will no longer persist to a file.
// In a serverless/containerized environment, env variables are typically immutable at runtime for the process.
export async function updateConfig(newConfig: Partial<AppConfig>): Promise<AppConfig> {
    console.warn('updateConfig called, but persistent updates are disabled as we migrated to ENV variables. Please update your .env file.');
    return getConfig();
}

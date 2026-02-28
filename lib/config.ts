// lib/config.ts
import fs from 'fs';
import path from 'path';

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

const CONFIG_FILE = path.join(process.cwd(), 'event-config.json');

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

function readConfigFile(): AppConfig {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            // Merge with defaults to fill any missing fields
            return {
                ...DEFAULT_CONFIG,
                ...parsed,
                rateLimit: {
                    ...DEFAULT_CONFIG.rateLimit,
                    ...(parsed.rateLimit || {})
                }
            };
        }
    } catch (e) {
        console.error('[CONFIG] Failed to read event-config.json, using defaults:', e);
    }
    return { ...DEFAULT_CONFIG };
}

function writeConfigFile(config: AppConfig): void {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
        console.error('[CONFIG] Failed to write event-config.json:', e);
        throw e;
    }
}

export async function getConfig(): Promise<AppConfig> {
    const fileConfig = readConfigFile();

    // Still allow env-var overrides for static/deployment-time settings
    const dynamicScoring = process.env.DYNAMIC_SCORING === 'true' || fileConfig.dynamicScoring;
    const rateLimit = {
        maxAttempts: Number(process.env.RATE_LIMIT_MAX_ATTEMPTS) || fileConfig.rateLimit.maxAttempts,
        windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || fileConfig.rateLimit.windowSeconds,
        cooldownSeconds: Number(process.env.RATE_LIMIT_COOLDOWN_SECONDS) || fileConfig.rateLimit.cooldownSeconds,
    };

    return {
        ...fileConfig,
        dynamicScoring,
        rateLimit,
    };
}

export async function updateConfig(newConfig: Partial<AppConfig>): Promise<AppConfig> {
    const currentConfig = await getConfig();

    // Validate eventState if provided
    let validatedNewConfig = { ...newConfig };
    if (newConfig.eventState) {
        const validStates = ['START', 'PAUSE', 'STOP'];
        if (!validStates.includes(newConfig.eventState)) {
            console.warn(`Invalid eventState '${newConfig.eventState}'. Keeping current state.`);
            delete validatedNewConfig.eventState;
        }
    }

    const updatedConfig: AppConfig = {
        ...currentConfig,
        ...validatedNewConfig,
        rateLimit: {
            ...currentConfig.rateLimit,
            ...(validatedNewConfig.rateLimit || {})
        }
    };

    writeConfigFile(updatedConfig);
    console.log('[CONFIG] event-config.json updated:', updatedConfig);
    return updatedConfig;
}

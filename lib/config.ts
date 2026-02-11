import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

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
    try {
        const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, create it with defaults
            try {
                await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf-8');
                return DEFAULT_CONFIG;
            } catch (writeError) {
                console.error('Failed to create default config.json', writeError);
            }
        } else {
            console.warn('Failed to read config.json, using defaults.', error);
        }
        return DEFAULT_CONFIG;
    }
}

export async function updateConfig(newConfig: Partial<AppConfig>): Promise<AppConfig> {
    try {
        const currentConfig = await getConfig();
        const updatedConfig = { ...currentConfig, ...newConfig };
        await fs.writeFile(CONFIG_PATH, JSON.stringify(updatedConfig, null, 4), 'utf-8');
        return updatedConfig;
    } catch (error) {
        console.error('Failed to update config.json', error);
        throw error;
    }
}

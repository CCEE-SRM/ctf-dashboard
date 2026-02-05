import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Ensure the URL has a protocol if it's not a simple localhost fallback
const formattedUrl = redisUrl.includes('://') ? redisUrl : `redis://${redisUrl}`;

const redis = new Redis(formattedUrl);

export { redis };

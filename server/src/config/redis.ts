import { createClient } from 'redis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || '6379';

console.log(`[Redis] Initializing client pointing to redis://${redisHost}:${redisPort}`);

export const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`
});

redisClient.on('error', (err) => {
  console.error('[Redis] Client Connection Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[Redis] Client successfully connected to server.');
});

// Auto-connect to Redis
let isConnected = false;
export async function connectRedis() {
  if (isConnected) return;
  try {
    await redisClient.connect();
    isConnected = true;
  } catch (err: any) {
    console.error('[Redis] Failed to connect on startup:', err.message);
  }
}

// Caching helper functions
export async function getCache(key: string): Promise<any | null> {
  if (!isConnected) return null;
  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value);
    }
  } catch (err: any) {
    console.error(`[Redis] Error getting key "${key}":`, err.message);
  }
  return null;
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  if (!isConnected) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err: any) {
    console.error(`[Redis] Error setting key "${key}":`, err.message);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  if (!isConnected) return;
  try {
    await redisClient.del(key);
  } catch (err: any) {
    console.error(`[Redis] Error deleting key "${key}":`, err.message);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  if (!isConnected) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[Redis] Invalidate keys matching pattern "${pattern}":`, keys);
    }
  } catch (err: any) {
    console.error(`[Redis] Error invalidating pattern "${pattern}":`, err.message);
  }
}

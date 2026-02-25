import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(redisUrl);
export const redisPublisher = new Redis(redisUrl);
export const redisSubscriber = new Redis(redisUrl);

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisPublisher.on('error', (err) => console.error('Redis Publisher Error', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

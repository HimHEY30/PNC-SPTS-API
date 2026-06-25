import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port') || 6379;

    // Skip Redis entirely if host is not configured or resolves to localhost inside Docker
    if (!host || host === 'localhost') {
      this.logger.warn(
        '[RedisService] REDIS_HOST is not set or is localhost — Redis cache disabled. All requests will hit DB directly.',
      );
      return;
    }

    this.client = new Redis({
      host,
      port: Number(port),
      // Fail immediately on each request — no retry loops that cause 504 hangs
      maxRetriesPerRequest: 0,
      // Connection timeout in ms
      connectTimeout: 2000,
      // Do not queue commands when offline — throw immediately so try-catch fires
      enableOfflineQueue: false,
      // Do not block app startup waiting for Redis
      lazyConnect: true,
    });

    // Connect in background; if it fails, cache is simply disabled
    this.client.connect().catch(() => {
      this.logger.warn('[RedisService] Could not connect to Redis — cache disabled, falling back to DB.');
      this.client = null;
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }
}

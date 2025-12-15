import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType | null = null;
  private readonly url: string;

  private constructor() {
    this.url = process.env.REDIS_URL || 'redis://localhost:6379';
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      console.log('[Redis] Connecting to', this.url);
      this.client = createClient({ url: this.url });
      
      this.client.on('error', (err) => {
        console.error('[Redis] Client error:', err);
      });

      this.client.on('connect', () => {
        console.log('[Redis] Connecting...');
      });

      this.client.on('ready', () => {
        console.log('[Redis] Connected successfully');
      });

      this.client.on('end', () => {
        console.log('[Redis] Connection ended');
      });

      await this.client.connect();
    } catch (error) {
      console.error('[Redis] Failed to connect:', error);
      // Don't throw - allow app to continue without Redis
      console.warn('[Redis] Continuing without cache - some features may be slower');
    }
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        console.log('[Redis] Disconnected');
      }
    } catch (error) {
      console.error('[Redis] Error disconnecting:', error);
    }
  }

  public isConnected(): boolean {
    return this.client?.isOpen || false;
  }
}

export const redisConnection = RedisConnection.getInstance();


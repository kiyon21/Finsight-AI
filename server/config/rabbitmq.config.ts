import amqp, { Connection, Channel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export class RabbitMQConnection {
  private static instance: RabbitMQConnection;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly url: string;

  private constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  public static getInstance(): RabbitMQConnection {
    if (!RabbitMQConnection.instance) {
      RabbitMQConnection.instance = new RabbitMQConnection();
    }
    return RabbitMQConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      console.log('[RabbitMQ] Connecting to', this.url);
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err);
      });

      this.connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed');
      });

      console.log('[RabbitMQ] Connected successfully');
    } catch (error) {
      console.error('[RabbitMQ] Failed to connect:', error);
      throw error;
    }
  }

  public async getChannel(): Promise<Channel> {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel!;
  }

  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('[RabbitMQ] Connection closed');
    } catch (error) {
      console.error('[RabbitMQ] Error closing connection:', error);
    }
  }
}

export const rabbitMQConnection = RabbitMQConnection.getInstance();


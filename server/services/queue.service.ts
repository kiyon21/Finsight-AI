import { Channel } from 'amqplib';
import { rabbitMQConnection } from '../config/rabbitmq.config';

export interface CSVJobPayload {
  jobId: string;
  uid: string;
  csvContent: string;
  fileName: string;
  timestamp: string;
}

export interface JobStatus {
  jobId: string;
  uid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  totalTransactions?: number;
  addedTransactions?: number;
  modifiedTransactions?: number;
  balance?: number;
  balanceUpdated?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class QueueService {
  private channel: Channel | null = null;
  private readonly CSV_QUEUE = 'csv_processing_queue';

  async initialize(): Promise<void> {
    this.channel = await rabbitMQConnection.getChannel();
    
    // Assert queue exists (create if doesn't exist)
    await this.channel.assertQueue(this.CSV_QUEUE, {
      durable: true, // Queue survives RabbitMQ restart
    });

    console.log('[Queue Service] Initialized CSV processing queue');
  }

  async publishCSVJob(payload: CSVJobPayload): Promise<void> {
    if (!this.channel) {
      await this.initialize();
    }

    const message = JSON.stringify(payload);
    
    this.channel!.sendToQueue(
      this.CSV_QUEUE,
      Buffer.from(message),
      {
        persistent: true, // Message survives RabbitMQ restart
      }
    );

    console.log(`[Queue Service] Published CSV job: ${payload.jobId}`);
  }

  async consumeCSVJobs(callback: (payload: CSVJobPayload) => Promise<void>): Promise<void> {
    if (!this.channel) {
      await this.initialize();
    }

    // Set prefetch to 1 - only process one message at a time
    await this.channel!.prefetch(1);

    console.log('[Queue Service] Waiting for CSV processing jobs...');

    this.channel!.consume(
      this.CSV_QUEUE,
      async (msg) => {
        if (msg) {
          try {
            const payload: CSVJobPayload = JSON.parse(msg.content.toString());
            console.log(`[Queue Service] Processing job: ${payload.jobId}`);
            
            await callback(payload);
            
            // Acknowledge the message (remove from queue)
            this.channel!.ack(msg);
            console.log(`[Queue Service] Job completed: ${payload.jobId}`);
          } catch (error) {
            console.error('[Queue Service] Error processing job:', error);
            
            // Reject and requeue the message (will be retried)
            this.channel!.nack(msg, false, true);
          }
        }
      },
      {
        noAck: false, // Manual acknowledgment
      }
    );
  }

  async close(): Promise<void> {
    await rabbitMQConnection.close();
  }
}


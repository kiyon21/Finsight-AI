import { adminDb } from '../config/firebase.config';
import { JobStatus } from './queue.service';

export class JobService {
  private readonly JOBS_COLLECTION = 'jobs';

  async createJob(jobId: string, uid: string, fileName: string): Promise<void> {
    try {
      await adminDb
        .collection(this.JOBS_COLLECTION)
        .doc(jobId)
        .set({
          jobId,
          uid,
          fileName,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      
      console.log(`[Job Service] Created job: ${jobId}`);
    } catch (error: any) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  async updateJobStatus(jobId: string, updates: Partial<JobStatus>): Promise<void> {
    try {
      await adminDb
        .collection(this.JOBS_COLLECTION)
        .doc(jobId)
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      
      console.log(`[Job Service] Updated job ${jobId}:`, updates.status);
    } catch (error: any) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const doc = await adminDb
        .collection(this.JOBS_COLLECTION)
        .doc(jobId)
        .get();
      
      if (!doc.exists) {
        return null;
      }

      return doc.data() as JobStatus;
    } catch (error: any) {
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  async getUserJobs(uid: string, limit: number = 10): Promise<JobStatus[]> {
    try {
      const snapshot = await adminDb
        .collection(this.JOBS_COLLECTION)
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as JobStatus);
    } catch (error: any) {
      throw new Error(`Failed to get user jobs: ${error.message}`);
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await adminDb
        .collection(this.JOBS_COLLECTION)
        .doc(jobId)
        .delete();
      
      console.log(`[Job Service] Deleted job: ${jobId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  async cleanupOldJobs(daysOld: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const snapshot = await adminDb
        .collection(this.JOBS_COLLECTION)
        .where('createdAt', '<', cutoffDate.toISOString())
        .get();

      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`[Job Service] Cleaned up ${snapshot.size} old jobs`);
    } catch (error: any) {
      throw new Error(`Failed to cleanup old jobs: ${error.message}`);
    }
  }
}


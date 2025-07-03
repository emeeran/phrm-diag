/**
 * Background job processing system for performance optimization
 */

import { EventEmitter } from 'events';

// Job status enum
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Job interface
export interface Job {
  id: string;
  type: string;
  data: any;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

// Job processor function type
export type JobProcessor<T = any> = (data: T) => Promise<any>;

// Background job queue
export class JobQueue extends EventEmitter {
  private jobs = new Map<string, Job>();
  private processors = new Map<string, JobProcessor>();
  private running = false;
  private concurrency = 3;
  private activeJobs = new Set<string>();

  constructor(concurrency: number = 3) {
    super();
    this.concurrency = concurrency;
  }

  // Register a job processor
  registerProcessor<T>(jobType: string, processor: JobProcessor<T>): void {
    this.processors.set(jobType, processor);
  }

  // Add a job to the queue
  async addJob(
    type: string,
    data: any,
    options: {
      priority?: number;
      maxAttempts?: number;
      delay?: number;
    } = {}
  ): Promise<string> {
    const job: Job = {
      id: this.generateJobId(),
      type,
      data,
      status: JobStatus.PENDING,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);
    this.emit('jobAdded', job);

    // Start processing if not already running
    if (!this.running) {
      this.start();
    }

    return job.id;
  }

  // Start processing jobs
  start(): void {
    if (this.running) return;
    this.running = true;
    this.processJobs();
  }

  // Stop processing jobs
  stop(): void {
    this.running = false;
  }

  // Get job status
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  // Get all jobs
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  // Get jobs by status
  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  // Cancel a job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === JobStatus.RUNNING) {
      return false;
    }

    job.status = JobStatus.CANCELLED;
    this.emit('jobCancelled', job);
    return true;
  }

  // Clear completed jobs
  clearCompleted(): number {
    const completedJobs = this.getJobsByStatus(JobStatus.COMPLETED);
    completedJobs.forEach(job => this.jobs.delete(job.id));
    return completedJobs.length;
  }

  // Process jobs
  private async processJobs(): Promise<void> {
    while (this.running) {
      if (this.activeJobs.size >= this.concurrency) {
        await this.sleep(100);
        continue;
      }

      const nextJob = this.getNextJob();
      if (!nextJob) {
        await this.sleep(1000);
        continue;
      }

      this.processJob(nextJob);
    }
  }

  // Get next job to process
  private getNextJob(): Job | null {
    const pendingJobs = this.getJobsByStatus(JobStatus.PENDING)
      .sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());

    return pendingJobs[0] || null;
  }

  // Process a single job
  private async processJob(job: Job): Promise<void> {
    this.activeJobs.add(job.id);
    job.status = JobStatus.RUNNING;
    job.startedAt = new Date();
    job.attempts++;

    this.emit('jobStarted', job);

    try {
      const processor = this.processors.get(job.type);
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`);
      }

      const result = await processor(job.data);
      
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.result = result;
      
      this.emit('jobCompleted', job);
    } catch (error) {
      job.error = error instanceof Error ? error.message : String(error);
      
      if (job.attempts >= job.maxAttempts) {
        job.status = JobStatus.FAILED;
        this.emit('jobFailed', job);
      } else {
        job.status = JobStatus.PENDING;
        this.emit('jobRetry', job);
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  // Generate unique job ID
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get queue statistics
  getStats() {
    const allJobs = this.getAllJobs();
    return {
      total: allJobs.length,
      pending: this.getJobsByStatus(JobStatus.PENDING).length,
      running: this.getJobsByStatus(JobStatus.RUNNING).length,
      completed: this.getJobsByStatus(JobStatus.COMPLETED).length,
      failed: this.getJobsByStatus(JobStatus.FAILED).length,
      cancelled: this.getJobsByStatus(JobStatus.CANCELLED).length,
      activeWorkers: this.activeJobs.size,
      concurrency: this.concurrency,
    };
  }
}

// Global job queue instance
export const globalJobQueue = new JobQueue(5);

// Pre-defined job processors for common tasks
export const JobProcessors = {
  // Email sending job
  sendEmail: async (data: { to: string; subject: string; body: string }) => {
    // Implement email sending logic here
    console.log(`Sending email to ${data.to}: ${data.subject}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate async operation
    return { sent: true, timestamp: new Date() };
  },

  // Document processing job
  processDocument: async (data: { documentId: string; userId: string }) => {
    // Implement document processing logic here
    console.log(`Processing document ${data.documentId} for user ${data.userId}`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate async operation
    return { processed: true, documentId: data.documentId };
  },

  // AI analysis job
  analyzeHealthData: async (data: { userId: string; recordIds: string[] }) => {
    // Implement AI analysis logic here
    console.log(`Analyzing health data for user ${data.userId}`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate async operation
    return { analyzed: true, insights: ['insight1', 'insight2'] };
  },

  // Database cleanup job
  cleanupDatabase: async (data: { retentionDays: number }) => {
    // Implement database cleanup logic here
    console.log(`Cleaning up database with ${data.retentionDays} days retention`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate async operation
    return { cleaned: true, recordsRemoved: 150 };
  },

  // Report generation job
  generateReport: async (data: { userId: string; reportType: string; dateRange: any }) => {
    // Implement report generation logic here
    console.log(`Generating ${data.reportType} report for user ${data.userId}`);
    await new Promise(resolve => setTimeout(resolve, 8000)); // Simulate async operation
    return { generated: true, reportId: `report_${Date.now()}` };
  },
};

// Register default processors
Object.entries(JobProcessors).forEach(([type, processor]) => {
  globalJobQueue.registerProcessor(type, processor);
});

// Job management utilities
export const jobUtils = {
  // Schedule recurring jobs
  scheduleRecurringJob: (
    type: string,
    data: any,
    intervalMs: number,
    options?: { priority?: number; maxAttempts?: number }
  ) => {
    const scheduleNext = () => {
      globalJobQueue.addJob(type, data, options);
      setTimeout(scheduleNext, intervalMs);
    };
    scheduleNext();
  },

  // Bulk job operations
  addMultipleJobs: async (jobs: Array<{ type: string; data: any; options?: any }>) => {
    const jobIds = await Promise.all(
      jobs.map(job => globalJobQueue.addJob(job.type, job.data, job.options))
    );
    return jobIds;
  },

  // Wait for job completion
  waitForJob: (jobId: string, timeoutMs: number = 30000): Promise<Job> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Job timeout'));
      }, timeoutMs);

      const checkJob = () => {
        const job = globalJobQueue.getJob(jobId);
        if (!job) {
          clearTimeout(timeout);
          reject(new Error('Job not found'));
          return;
        }

        if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
          clearTimeout(timeout);
          resolve(job);
          return;
        }

        setTimeout(checkJob, 500);
      };

      checkJob();
    });
  },
};

// Start the global job queue
globalJobQueue.start();

// Schedule database cleanup every 24 hours
jobUtils.scheduleRecurringJob(
  'cleanupDatabase',
  { retentionDays: 90 },
  24 * 60 * 60 * 1000 // 24 hours
);

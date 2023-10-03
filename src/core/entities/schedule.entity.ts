export class Schedule {
  id: number | string;

  serviceName: string;

  jobName: string;

  jobDescription: string;

  cronTime: string;

  data: Record<string, any>;

  triggerMethod: string;

  kafkaTopic: string;

  webhookUrl: string;

  retry: boolean;

  retryBaseDelay: number;

  retryCount: number;

  currentRetry: number;

  isOnce: boolean;

  isError: boolean;

  isActive: boolean;
}

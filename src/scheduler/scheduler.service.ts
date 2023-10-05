import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CreateSchedulerDto } from './dto/createScheduler.dto';
import { IDataServices } from 'src/core/abstracts/dataServices.abstract';
import { Schedule } from 'src/core/entities/schedule.entity';
import { TriggerService } from './trigger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);

  retryBaseDelay = this.configService.get<number>('retryBaseDelay');
  retryCount = this.configService.get<number>('retryCount');

  constructor(
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private dataService: IDataServices,
    private triggerService: TriggerService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('SchedulerService onApplicationBootstrap Start');
    await this.initScheduleJobs();
    this.logger.log('SchedulerService onApplicationBootstrap Finish');

    this.logRetryInfo();
  }

  async create(createSchedulerDto: CreateSchedulerDto) {
    let job: Schedule = await this.dataService.schedules.findOne({
      serviceName: createSchedulerDto.serviceName,
      jobName: createSchedulerDto.jobName,
      isActive: true,
    });

    if (job) {
      job = await this.dataService.schedules.findByIdAndUpdate(
        job.id,
        createSchedulerDto,
      );
      this.reScheduleJob(job);
    } else {
      job = await this.dataService.schedules.create(createSchedulerDto);
      this.scheduleJob(job);
    }

    return job;
  }

  async disableJob(serviceName: string, jobName: string) {
    const job = await this.dataService.schedules.fineOneAndUpdate(
      { serviceName, jobName, isActive: true },
      { isActive: false },
    );

    if (job) {
      const serviceJobName = `${serviceName}-${jobName}`;
      this.unScheduleJob(serviceJobName);
      this.unScheduleRetryJob(serviceJobName);
    }

    return job;
  }

  async initScheduleJobs() {
    const schedules = await this.dataService.schedules.find({ isActive: true });

    for (const schedule of schedules) {
      this.scheduleJob(schedule);
    }
  }

  scheduleJob(schedule: Schedule) {
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    const job = new CronJob(schedule.cronTime, () => {
      this.logger.log(`Time for job ${serviceJobName} to run!`);
      this.executeJob(schedule.id, serviceJobName);
    });

    this.schedulerRegistry.addCronJob(`${serviceJobName}`, job);

    job.start();

    this.logger.log(
      `Job ${serviceJobName} added with cronTime ${schedule.cronTime}`,
    );
  }

  reScheduleJob(schedule: Schedule) {
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    this.logger.log(`Re-Scheduling Job ${serviceJobName}`);

    this.unScheduleJob(serviceJobName);

    this.scheduleJob(schedule);
  }

  unScheduleJob(serviceJobName: string) {
    try {
      if (this.schedulerRegistry.doesExist('cron', serviceJobName)) {
        this.schedulerRegistry.deleteCronJob(serviceJobName);
        this.logger.log(`Job ${serviceJobName} is unScheduled!`);
      }
    } catch (error) {
      this.logger.error(`Job ${serviceJobName} not found for unScheduling`);
      this.logger.error(error);
    }
  }

  unScheduleRetryJob(serviceJobName: string) {
    try {
      if (this.schedulerRegistry.doesExist('timeout', serviceJobName)) {
        this.schedulerRegistry.deleteTimeout(serviceJobName);
        this.logger.log(`Retry Job ${serviceJobName} is unScheduled!`);
      }
    } catch (error) {
      this.logger.error(
        `Retry Job ${serviceJobName} not found for unScheduling`,
      );
      this.logger.error(error);
    }
  }

  async executeJob(id: number | string, serviceJobName: string) {
    const schedule = await this.dataService.schedules.findById(id);

    if (!schedule) {
      this.logger.error(`Schedule not found for Job ${serviceJobName}`);
      this.unScheduleJob(serviceJobName);
      return;
    }

    if (!this.triggerService.isValidTrigger(schedule)) {
      await this.inValidTriggerMethod(schedule);
      return;
    }

    this.unScheduleRetryJob(serviceJobName);

    this.logger.log(
      `Running Job ${serviceJobName}, trigger method ${schedule.triggerMethod}`,
    );

    try {
      await this.triggerService.trigger(schedule);

      this.logger.log(`Job ${serviceJobName} completed successfully`);

      // We case we previously had error but now no error
      schedule.isError = false;

      if (schedule.retry) {
        schedule.retryCount = 0;
      }

      if (schedule.isOnce) {
        schedule.isActive = false;
      }
      await this.dataService.schedules.findByIdAndUpdate(schedule.id, schedule);
    } catch (error) {
      this.logger.error(`Job ${serviceJobName} fail, encounter error`);
      this.logger.error(error);

      // We already know the Trigger is Valid
      await this.dataService.schedules.findByIdAndUpdate(schedule.id, {
        isError: true,
      });

      await this.handleFailJob(schedule.id);
    }
  }

  private async handleFailJob(id: number | string) {
    const schedule = await this.dataService.schedules.findById(id);
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    const retryCount = schedule.retryCount ?? this.retryCount;

    if (schedule.retry && schedule.currentRetry <= retryCount) {
      this.scheduleRetryJob(schedule);
    } else if (schedule.isOnce) {
      this.unScheduleJob(serviceJobName);
      await this.dataService.schedules.findByIdAndUpdate(schedule.id, {
        isActive: false,
      });
    }
  }

  async scheduleRetryJob(schedule: Schedule) {
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    const retryCount = schedule.retryCount ?? this.retryCount;

    const currentRetry = schedule.currentRetry + 1;

    if (currentRetry > retryCount) {
      this.logger.error(
        `Job ${serviceJobName} has already reach retry count ${retryCount}`,
      );
      return;
    }

    const nextInterval = this.getRetryInterval(
      currentRetry,
      schedule.retryBaseDelay,
    );

    const timeOut = setTimeout(() => {
      this.logger.log(`Time for retry job ${serviceJobName} to run!`);

      this.executeJob(schedule.id, serviceJobName);
    }, nextInterval * 1000 /* seconds to milliseconds */);

    this.schedulerRegistry.addTimeout(serviceJobName, timeOut);
    this.logger.log(
      `Retry Job ${serviceJobName} added with timeout ${nextInterval} seconds or ${
        nextInterval / 60
      } minutes`,
    );

    await this.dataService.schedules.findByIdAndUpdate(schedule.id, {
      currentRetry,
    });
  }

  private async inValidTriggerMethod(schedule: Schedule) {
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    this.logger.error(`Job ${serviceJobName}, Invalid Trigger Method`);

    this.unScheduleJob(serviceJobName);

    await this.dataService.schedules.findByIdAndUpdate(schedule.id, {
      isError: true,
      isActive: false,
    });
  }

  logRetryInfo() {
    this.logger.log(`RETRY_BASE_DELAY_SECOND=${this.retryBaseDelay} seconds`);
    this.logger.log(`RETRY_COUNT=${this.retryCount}`);

    let i = 1;
    let seconds = 0;

    this.logger.log('This is how our retry will look like');
    const retryTable = [];

    while (i <= this.retryCount) {
      const interval = this.getRetryInterval(i);
      // const interval = Math.pow(this.initialRetry, i);
      seconds += interval;

      retryTable.push({
        'Retry Count': i,
        'Interval (Seconds)': interval,
        'Interval (Minutes)': Number((interval / 60).toFixed(2)),
        'Time Pass (Seconds)': seconds,
        'Time Pass (Minutes)': Number((seconds / 60).toFixed(2)),
        'Time Pass (Hours)': Number((seconds / 3600).toFixed(2)),
      });
      ++i;
    }
    console.table(retryTable);
  }

  getRetryInterval(count: number, baseDelay?: number) {
    return (baseDelay ?? this.retryBaseDelay) * 2 ** count;
  }
}

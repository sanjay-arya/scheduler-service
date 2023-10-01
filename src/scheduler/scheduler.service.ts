import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CreateSchedulerDto } from './dto/createScheduler.dto';
import { IDataServices } from 'src/core/abstracts/dataServices.abstract';
import { Schedule } from 'src/core/entities/schedule.entity';
import { TriggerMethodNotFound, TriggerService } from './trigger.service';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private dataService: IDataServices,
    private triggerService: TriggerService,
  ) {}

  async onApplicationBootstrap() {
    console.log('SchedulerService onApplicationBootstrap Start');
    await this.initScheduleJobs();
    console.log('SchedulerService onApplicationBootstrap Finish');
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
      this.unScheduleJob(`${serviceName}-${jobName}`);
    }

    return job;
  }

  async initScheduleJobs() {
    const schedules = await this.dataService.schedules.find({ isActive: true });

    for (const schedule of schedules) {
      await this.scheduleJob(schedule);
    }
  }

  async scheduleJob(schedule: Schedule) {
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

  async reScheduleJob(schedule: Schedule) {
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    this.logger.log(`Re-Scheduling Job ${serviceJobName}`);

    this.unScheduleJob(serviceJobName);

    await this.scheduleJob(schedule);
  }

  unScheduleJob(serviceJobName: string) {
    try {
      this.schedulerRegistry.deleteCronJob(serviceJobName);
      this.logger.log(`Job ${serviceJobName} is unScheduled!`);
    } catch (error) {
      this.logger.error(`Job ${serviceJobName} not found for unScheduling`);
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

    this.logger.log(
      `Running Job ${serviceJobName}, trigger method ${schedule.triggerMethod}`,
    );

    try {
      await this.triggerService.trigger(schedule);

      this.logger.log(`Job ${serviceJobName} completed successfully`);

      schedule.isError = false;
    } catch (error) {
      this.logger.error(`Job ${serviceJobName} fail, encounter error`);
      this.logger.error(error);

      if (error instanceof TriggerMethodNotFound) {
        await this.inValidTriggerMethod(schedule);
        return;
      }

      schedule.isError = true;

      if (schedule.retry) {
        this.logger.log(
          `Job ${serviceJobName} has enabled retry, so we will retry this job`,
        );
        // Coming Soon
      }
    }

    if (schedule.isOnce && (schedule.isError ? !schedule.retry : true)) {
      this.logger.log(`Job ${serviceJobName} is a one time job with no retry`);
      schedule.isActive = false;

      this.unScheduleJob(serviceJobName);
    }

    await this.dataService.schedules.findByIdAndUpdate(schedule.id, schedule);
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
}

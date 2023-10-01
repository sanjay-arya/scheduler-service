import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TriggerMethod } from './enum/triggerMethod.enum';
import axios from 'axios';
import { CreateSchedulerDto } from './dto/createScheduler.dto';
import { lastValueFrom } from 'rxjs';
import { error } from 'console';
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

  async delete(serviceName: string, jobName: string) {
    let job = await this.dataService.schedules.findOne({
      serviceName,
      jobName,
      isActive: true,
    });

    if (job) {
      job = await this.dataService.schedules.findByIdAndUpdate(job.id, {
        isActive: false,
      });

      await this.unScheduleJob(`${job.serviceName}-${job.jobName}`);
    }
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
      `Job ${serviceJobName} added with cronTime ${schedule.cronTime}!`,
    );
  }

  async reScheduleJob(schedule: Schedule) {
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    this.logger.log(`Re-Scheduling Job ${serviceJobName}`);

    this.unScheduleJob(serviceJobName);

    await this.scheduleJob(schedule);
  }

  async unScheduleJob(serviceJobName: string) {
    try {
      this.schedulerRegistry.deleteCronJob(serviceJobName);
      this.logger.log(`Job ${serviceJobName} is deleted!`);
    } catch (error) {
      this.logger.error(`Job ${serviceJobName} not found for deletion`);
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

    this.logger.log(
      `Running Job ${serviceJobName}, trigger method ${schedule.triggerMethod}`,
    );

    try {
      await this.triggerService.trigger(schedule);

      this.logger.log(`Job ${serviceJobName} completed successfully`);

      if (schedule.isOnce) {
        schedule.isActive = false;
        await this.dataService.schedules.findByIdAndUpdate(
          schedule.id,
          schedule,
        );

        this.logger.log(`Job ${serviceJobName} is a one time job.`);
        this.unScheduleJob(serviceJobName);
      }
    } catch (error) {
      this.logger.error(`Job ${serviceJobName} fail, encounter error`);
      this.logger.error(error);

      schedule.isError = true;

      if (error instanceof TriggerMethodNotFound) {
        this.logger.log(
          `Job ${serviceJobName} will be disabled since trigger method not found`,
        );
        schedule.isActive = false;

        this.unScheduleJob(serviceJobName);
      } else if (schedule.isOnce && !schedule.retry) {
        this.logger.log(
          `Job ${serviceJobName} is a one time job with no retry`,
        );
        schedule.isActive = false;

        this.unScheduleJob(serviceJobName);
      }

      await this.dataService.schedules.findByIdAndUpdate(schedule.id, schedule);
    }
  }
}

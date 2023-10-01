import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Optional,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Schedule, ScheduleDocument } from './schemes/schedule.schema';
import { Model } from 'mongoose';
import { CronJob } from 'cron';
import { TriggerMethod } from './enum/triggerMethod.enum';
import axios from 'axios';
import { CreateSchedulerDto } from './dto/createScheduler.dto';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { error } from 'console';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @Optional() @Inject('KAFKA_SERVICE') private clientKafka: ClientKafka,
  ) {
    // this.clientKafka.connect();
  }

  async onApplicationBootstrap() {
    console.log('SchedulerService onApplicationBootstrap Start');
    await this.initScheduleJobs();
    console.log('SchedulerService onApplicationBootstrap Finish');
  }

  async create(createSchedulerDto: CreateSchedulerDto) {
    const job_id = await this.scheduleModel.exists({
      serviceName: createSchedulerDto.serviceName,
      jobName: createSchedulerDto.jobName,
      isActive: true,
    });

    let job: ScheduleDocument;

    if (job_id) {
      job = await this.scheduleModel.findByIdAndUpdate(
        job_id,
        createSchedulerDto,
        { new: true },
      );
      console.log(job);
      this.reScheduleJob(job);
    } else {
      job = await this.scheduleModel.create(createSchedulerDto);
      console.log(job);
      this.scheduleJob(job);
    }

    return job;
  }

  async delete(serviceName: string, jobName: string) {
    const job = await this.scheduleModel.findOne({
      serviceName,
      jobName,
      isActive: true,
    });

    if (job) {
      job.isActive = false;
      await job.save();

      await this.unScheduleJob(`${job.serviceName}-${job.jobName}`);
    }
  }

  async initScheduleJobs() {
    const schedules = await this.scheduleModel.find({ isActive: true });

    for (const schedule of schedules) {
      await this.scheduleJob(schedule);
    }
  }

  async scheduleJob(schedule: ScheduleDocument) {
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

  async reScheduleJob(schedule: ScheduleDocument) {
    const serviceJobName = `${schedule.serviceName}-${schedule.jobName}`;

    this.logger.log(`Re-Scheduling Job ${serviceJobName}`);

    // this.schedulerRegistry.deleteCronJob(serviceJobName);
    // this.logger.log(`Job ${serviceJobName} is deleted!`);
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

  async executeJob(id: string, serviceJobName: string) {
    const schedule = await this.scheduleModel.findById(id);

    if (!schedule) {
      this.logger.error(`Schedule not found for Job ${serviceJobName}`);
      this.unScheduleJob(serviceJobName);
      return;
    }

    this.logger.log(
      `Running Job ${serviceJobName}, trigger method ${schedule.triggerMethod}`,
    );

    try {
      switch (schedule.triggerMethod) {
        case TriggerMethod.REST:
          await axios.post(schedule.webhookUrl, schedule?.data);
          break;
        case TriggerMethod.KAFKA:
          await lastValueFrom(
            this.clientKafka.emit(schedule.kafkaTopic, { ...schedule?.data }),
          );
          break;

        default:
          throw error('Unknow Trigger Method');
      }

      this.logger.log(`Job ${serviceJobName} completed successfully`);

      if (schedule.isOnce) {
        schedule.isActive = false;
        await schedule.save();

        this.logger.log(`Job ${serviceJobName} is a one time job.`);
        this.unScheduleJob(serviceJobName);
      }
    } catch (error) {
      this.logger.error(`Job ${serviceJobName} fail, encounter error`);
      this.logger.error(error);

      schedule.isError = true;

      if (schedule.isOnce && !schedule.retry) {
        this.logger.log(
          `Job ${serviceJobName} is a one time job with no retry`,
        );
        schedule.isActive = false;

        this.unScheduleJob(serviceJobName);
      }

      await schedule.save();
    }
  }
}

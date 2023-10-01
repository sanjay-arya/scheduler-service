import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Schedule, ScheduleDocument } from './schemes/schedule.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IDataServices } from 'src/core/abstracts/dataServices.abstract';
import { MongoGenericRepository } from './mongoGenericRepository';
import { IGenericRepository } from 'src/core/abstracts/genericRepository.abstract';

@Injectable()
export class MongoDataServices
  implements IDataServices, OnApplicationBootstrap
{
  schedules: IGenericRepository<ScheduleDocument>;

  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
  ) {}

  onApplicationBootstrap() {
    this.schedules = new MongoGenericRepository<ScheduleDocument>(
      this.scheduleModel,
    );
  }
}

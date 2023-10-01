import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/dataServices.abstract';
import { TypeOrmGenericRepository } from './typeormGenericRepository';
import { IGenericRepository } from 'src/core/abstracts/genericRepository.abstract';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleEntity } from './entity/schedule.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypeOrmDataServices
  implements IDataServices, OnApplicationBootstrap
{
  schedules: IGenericRepository<ScheduleEntity>;

  constructor(
    @InjectRepository(ScheduleEntity)
    private schedulesRepository: Repository<ScheduleEntity>,
  ) {}

  onApplicationBootstrap() {
    this.schedules = new TypeOrmGenericRepository<ScheduleEntity>(
      this.schedulesRepository,
    );
  }
}

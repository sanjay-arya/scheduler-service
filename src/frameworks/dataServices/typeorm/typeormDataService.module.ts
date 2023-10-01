import { Module } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/dataServices.abstract';
import { TypeOrmDataServices } from './typeormDataServices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/config/typeorm.config';
import { ScheduleEntity } from './entity/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([ScheduleEntity]),
  ],
  providers: [
    {
      provide: IDataServices,
      useClass: TypeOrmDataServices,
    },
  ],
  exports: [IDataServices],
})
export class TypeOrmDataServiceModule {}

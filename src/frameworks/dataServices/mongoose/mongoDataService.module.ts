import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from './schemes/schedule.schema';
import { IDataServices } from 'src/core/abstracts/dataServices.abstract';
import { MongoDataServices } from './mongoDataServices.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  providers: [
    {
      provide: IDataServices,
      useClass: MongoDataServices,
    },
  ],
  exports: [IDataServices],
})
export class MongoDataServiceModule {}

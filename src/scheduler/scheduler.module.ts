import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from './schemes/schedule.schema';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    {
      provide: 'KAFKA_SERVICE',
      useFactory: (configService: ConfigService) => {
        // if (process.env.PORT === '5009') {
        //   return null;
        // }
        return ClientProxyFactory.create({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: configService.get<string[]>('kafka.brokers'),
            },
            producer: {
              createPartitioner: Partitioners.DefaultPartitioner,
              allowAutoTopicCreation: true,
            },
            producerOnlyMode: true,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class SchedulerModule {}

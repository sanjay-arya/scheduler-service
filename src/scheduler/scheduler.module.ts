import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { MongoDataServiceModule } from 'src/frameworks/dataServices/mongoose/mongoDataService.module';
import { TypeOrmDataServiceModule } from 'src/frameworks/dataServices/typeorm/typeormDataService.module';
import { TriggerService } from './trigger.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    process.env.DATABASE_TYPE === 'mysql'
      ? TypeOrmDataServiceModule
      : MongoDataServiceModule,
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    TriggerService,
    {
      provide: 'KAFKA_SERVICE',
      useFactory: (configService: ConfigService) => {
        const brokers = configService.get<string[]>('kafka.brokers');

        // No Brokers mean no KAFKA
        if (brokers.length === 0) {
          return null;
        }

        return ClientProxyFactory.create({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers,
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

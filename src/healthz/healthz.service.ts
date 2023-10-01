import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  MicroserviceHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Partitioners } from 'kafkajs';

@Injectable()
export class HealthzService {
  constructor(
    private mongoose: MongooseHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) {}

  checkMongoose() {
    return this.mongoose.pingCheck('mongodb');
  }

  checkKafka() {
    return this.microservice.pingCheck('kafka', {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: this.configService.get<string[]>('kafka.brokers'),
        },
        producer: {
          createPartitioner: Partitioners.DefaultPartitioner,
          allowAutoTopicCreation: false,
        },
        producerOnlyMode: true,
      },
    });
  }
}

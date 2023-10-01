import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { ClientKafka } from '@nestjs/microservices';
import { TriggerMethod } from './enum/triggerMethod.enum';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';

export class TriggerMethodNotFound extends Error {}

@Injectable()
export class TriggerService {
  private readonly logger = new Logger(TriggerService.name);

  constructor(
    @Optional() @Inject('KAFKA_SERVICE') private clientKafka: ClientKafka,
  ) {
    this.clientKafka?.connect();
  }

  async trigger({
    triggerMethod,
    webhookUrl,
    kafkaTopic,
    data,
  }: {
    triggerMethod: string;
    webhookUrl: string;
    kafkaTopic: string;
    data: Record<string, any>;
  }) {
    console.log(triggerMethod, webhookUrl, kafkaTopic);
    switch (triggerMethod) {
      case TriggerMethod.REST:
        await axios.post(webhookUrl, data);
        break;
      case TriggerMethod.KAFKA:
        if (this.clientKafka) {
          await lastValueFrom(this.clientKafka.emit(kafkaTopic, { ...data }));
          break;
        }
      default:
        throw new TriggerMethodNotFound(
          `Trigger method ${triggerMethod} not found`,
        );
    }
  }
}

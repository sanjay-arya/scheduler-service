import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { ClientKafka } from '@nestjs/microservices';
import { TriggerMethod } from './enum/triggerMethod.enum';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';
import { Schedule } from 'src/core/entities/schedule.entity';

export class TriggerMethodNotFound extends Error {}

@Injectable()
export class TriggerService {
  private readonly logger = new Logger(TriggerService.name);

  private triggerMethods: Record<
    string,
    (schedule: Schedule) => Promise<void>
  > = {
    [TriggerMethod.REST]: this.triggerREST,
  };

  constructor(
    @Optional() @Inject('KAFKA_SERVICE') private clientKafka: ClientKafka,
  ) {
    if (this.clientKafka) {
      this.clientKafka.connect();
      this.triggerMethods[TriggerMethod.KAFKA] = this.triggerKafka.bind(this);
    }
  }

  isValidTrigger(schedule: Schedule): boolean {
    return !!this.triggerMethods[schedule.triggerMethod];
  }

  async trigger(schedule: Schedule) {
    const currentTrigger = this.triggerMethods[schedule.triggerMethod];

    if (currentTrigger) {
      await currentTrigger(schedule);
    } else {
      throw new TriggerMethodNotFound(
        `Trigger method ${schedule.triggerMethod} not found`,
      );
    }
  }

  private async triggerREST(schedule: Schedule) {
    await axios.post(schedule.webhookUrl, { ...schedule?.data });
  }

  private async triggerKafka(schedule: Schedule) {
    await lastValueFrom(
      this.clientKafka.emit(schedule.kafkaTopic, { ...schedule?.data }),
    );
  }
}

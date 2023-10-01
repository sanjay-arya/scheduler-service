import { Controller, Get } from '@nestjs/common';
import { HealthzService } from './healthz.service';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('healthz')
export class HealthzController {
  constructor(
    private health: HealthCheckService,
    private readonly healthzService: HealthzService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.healthzService.checkMongoose(),
      () => this.healthzService.checkKafka(),
    ]);
  }
}

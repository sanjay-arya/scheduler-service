import { Module } from '@nestjs/common';
import { HealthzService } from './healthz.service';
import { HealthzController } from './healthz.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule],
  controllers: [HealthzController],
  providers: [HealthzService],
})
export class HealthzModule {}

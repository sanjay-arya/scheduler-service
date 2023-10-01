import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ConfigModule } from '@nestjs/config';
import { config } from './config/config';
import { HealthzModule } from './healthz/healthz.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    SchedulerModule,
    HealthzModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Controller, Post, Body, Param, Delete } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CreateSchedulerDto } from './dto/createScheduler.dto';

@Controller('api/schedule')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  create(@Body() createSchedulerDto: CreateSchedulerDto) {
    return this.schedulerService.create(createSchedulerDto);
  }

  @Delete(':serviceName/:jobName')
  delete(
    @Param('serviceName') serviceName: string,
    @Param('jobName') jobName: string,
  ) {
    return this.schedulerService.delete(serviceName, jobName);
  }
}

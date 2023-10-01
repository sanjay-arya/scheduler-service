import { Test, TestingModule } from '@nestjs/testing';
import { HealthzController } from './healthz.controller';
import { HealthzService } from './healthz.service';

describe('HealthzController', () => {
  let controller: HealthzController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthzController],
      providers: [HealthzService],
    }).compile();

    controller = module.get<HealthzController>(HealthzController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

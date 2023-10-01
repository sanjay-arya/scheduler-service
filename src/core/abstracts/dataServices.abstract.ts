import { Schedule } from '../entities/schedule.entity';
import { IGenericRepository } from './genericRepository.abstract';

export abstract class IDataServices {
  abstract schedules: IGenericRepository<Schedule>;
}

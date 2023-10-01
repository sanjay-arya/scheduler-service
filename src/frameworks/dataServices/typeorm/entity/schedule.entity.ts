import { Schedule } from 'src/core/entities/schedule.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('schedule')
export class ScheduleEntity extends Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serviceName: string;

  @Column()
  jobName: string;

  @Column()
  jobDescription: string;

  @Column()
  cronTime: string;

  @Column('json')
  data: Record<string, any>;

  @Column()
  triggerMethod: string;

  @Column({ nullable: true })
  kafkaTopic: string;

  @Column({ nullable: true })
  webhookUrl: string;

  @Column({ default: false })
  retry: boolean;

  @Column({ default: false })
  isOnce: boolean;

  @Column({ default: false })
  isError: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

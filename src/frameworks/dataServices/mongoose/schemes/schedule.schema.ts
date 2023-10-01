import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Schedule as ScheduleEntity } from 'src/core/entities/schedule.entity';

export type ScheduleDocument = HydratedDocument<Schedule>;

@Schema({
  toJSON: {
    getters: true,
  },
  toObject: {
    getters: true,
  },
  timestamps: true,
})
export class Schedule extends ScheduleEntity {
  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  jobName: string;

  @Prop({ required: true })
  jobDescription: string;

  @Prop({ required: true })
  cronTime: string;

  @Prop({ type: Object, required: false })
  data: Record<string, any>;

  @Prop({ required: true })
  triggerMethod: string;

  @Prop({ required: false })
  kafkaTopic: string;

  @Prop({ required: false })
  webhookUrl: string;

  @Prop({ default: false })
  retry: boolean;

  @Prop({ default: false })
  isOnce: boolean;

  @Prop({ default: false })
  isError: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

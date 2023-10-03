import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { TriggerMethod } from '../enum/triggerMethod.enum';

export class CreateSchedulerDto {
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsString()
  @IsNotEmpty()
  jobName: string;

  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @IsString()
  @IsNotEmpty()
  cronTime: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(TriggerMethod)
  triggerMethod: string;

  @ValidateIf((item) => item.triggerMethod === TriggerMethod.KAFKA)
  @IsString()
  @IsNotEmpty()
  kafkaTopic: string;

  @ValidateIf((item) => item.triggerMethod === TriggerMethod.REST)
  @IsString()
  @IsNotEmpty()
  webhookUrl: string;

  @ValidateIf((item) => item.triggerMethod === TriggerMethod.REST)
  @IsBoolean()
  @IsOptional()
  retry: boolean;

  @ValidateIf((item) => item.triggerMethod === TriggerMethod.REST)
  @IsNumber()
  @IsOptional()
  retryBaseDelay: number;

  @ValidateIf((item) => item.triggerMethod === TriggerMethod.REST)
  @IsNumber()
  @IsOptional()
  retryCount: number;

  @IsBoolean()
  @IsOptional()
  isOnce: boolean;

  @IsObject()
  @IsOptional()
  data: Record<string, any>;
}

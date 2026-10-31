import { AttendanceType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAttendanceDto {
  @IsUUID()
  userId!: string;

  @IsEnum(AttendanceType)
  type!: AttendanceType;

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

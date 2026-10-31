import { AttendanceType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateAttendanceDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(AttendanceType)
  @IsOptional()
  type?: AttendanceType;

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

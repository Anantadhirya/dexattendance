import { AttendanceType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreateSelfAttendanceDto {
  @IsEnum(AttendanceType)
  type!: AttendanceType;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

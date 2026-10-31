import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateWorkScheduleDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(timePattern, { message: 'startTime must use HH:mm format' })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(timePattern, { message: 'endTime must use HH:mm format' })
  endTime?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(1440)
  lateThreshold?: number;
}

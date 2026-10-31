import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateWorkScheduleDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(timePattern, { message: 'startTime must use HH:mm format' })
  startTime!: string;

  @IsString()
  @Matches(timePattern, { message: 'endTime must use HH:mm format' })
  endTime!: string;

  @IsInt()
  @Min(0)
  @Max(1440)
  lateThreshold!: number;
}

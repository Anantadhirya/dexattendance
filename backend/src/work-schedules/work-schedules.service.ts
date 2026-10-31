import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateWorkScheduleDto } from './dto/create-work-schedule.dto.js';
import type { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto.js';

const scheduleSelect = {
  id: true,
  name: true,
  startTime: true,
  endTime: true,
  lateThreshold: true,
} as const;

function timeToDate(time: string) {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

function dateToTime(value: Date) {
  return value.toISOString().slice(11, 16);
}

function serializeSchedule(schedule: {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  lateThreshold: number;
}) {
  return {
    ...schedule,
    startTime: dateToTime(schedule.startTime),
    endTime: dateToTime(schedule.endTime),
  };
}

@Injectable()
export class WorkSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const schedules = await this.prisma.workSchedule.findMany({
      select: scheduleSelect,
      orderBy: { name: 'asc' },
    });

    return schedules.map(serializeSchedule);
  }

  async findOne(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
      select: scheduleSelect,
    });

    if (!schedule) {
      throw new NotFoundException('Work schedule not found');
    }

    return serializeSchedule(schedule);
  }

  async create(dto: CreateWorkScheduleDto) {
    const schedule = await this.prisma.workSchedule.create({
      data: {
        name: dto.name.trim(),
        startTime: timeToDate(dto.startTime),
        endTime: timeToDate(dto.endTime),
        lateThreshold: dto.lateThreshold,
      },
      select: scheduleSelect,
    });

    return serializeSchedule(schedule);
  }

  async update(id: string, dto: UpdateWorkScheduleDto) {
    await this.findOne(id);

    const data: Prisma.WorkScheduleUpdateInput = {
      name: dto.name?.trim(),
      startTime: dto.startTime ? timeToDate(dto.startTime) : undefined,
      endTime: dto.endTime ? timeToDate(dto.endTime) : undefined,
      lateThreshold: dto.lateThreshold,
    };

    const schedule = await this.prisma.workSchedule.update({
      where: { id },
      data,
      select: scheduleSelect,
    });

    return serializeSchedule(schedule);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.workSchedule.delete({ where: { id } });
    return { success: true };
  }
}

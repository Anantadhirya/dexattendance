import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import type { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import type { CreateSelfAttendanceDto } from './dto/create-self-attendance.dto.js';

const attendanceSelect = {
  id: true,
  userId: true,
  type: true,
  timestamp: true,
  imageUrl: true,
  latitude: true,
  longitude: true,
  notes: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

function serializeAttendance(attendance: {
  id: string;
  userId: string;
  type: AttendanceType;
  timestamp: Date;
  imageUrl: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  notes: string | null;
  user: { id: string; name: string; email: string };
}) {
  return {
    ...attendance,
    timestamp: attendance.timestamp.toISOString(),
    latitude: attendance.latitude?.toString() ?? null,
    longitude: attendance.longitude?.toString() ?? null,
  };
}

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const records = await this.prisma.attendanceRecord.findMany({
      select: attendanceSelect,
      orderBy: { timestamp: 'desc' },
    });

    return records.map(serializeAttendance);
  }

  async findOne(id: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      select: attendanceSelect,
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    return serializeAttendance(record);
  }

  async create(dto: CreateAttendanceDto) {
    await this.ensureUser(dto.userId);

    const record = await this.prisma.attendanceRecord.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
        notes: dto.notes?.trim()
          ? `${dto.notes.trim()} (Added by admin)`
          : 'Added by admin',
      },
      select: attendanceSelect,
    });

    return serializeAttendance(record);
  }

  async findTodayForUser(userId: string, timezoneOffsetMinutes = 0) {
    const now = new Date();
    const localNow = new Date(
      now.getTime() - timezoneOffsetMinutes * 60 * 1000,
    );
    const start = new Date(
      Date.UTC(
        localNow.getUTCFullYear(),
        localNow.getUTCMonth(),
        localNow.getUTCDate(),
      ) + timezoneOffsetMinutes * 60 * 1000,
    );
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const records = await this.prisma.attendanceRecord.findMany({
      where: { userId, timestamp: { gte: start, lt: end } },
      select: attendanceSelect,
      orderBy: { timestamp: 'asc' },
    });

    return records.map(serializeAttendance);
  }

  async createForUser(userId: string, dto: CreateSelfAttendanceDto) {
    const record = await this.prisma.attendanceRecord.create({
      data: {
        userId,
        type: dto.type,
        imageUrl: dto.imageUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes?.trim() || null,
      },
      select: attendanceSelect,
    });

    return serializeAttendance(record);
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    await this.findOne(id);
    if (dto.userId) {
      await this.ensureUser(dto.userId);
    }

    const data: Prisma.AttendanceRecordUpdateInput = {
      user: dto.userId ? { connect: { id: dto.userId } } : undefined,
      type: dto.type,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : undefined,
      notes: dto.notes === undefined ? undefined : dto.notes?.trim() || null,
    };

    const record = await this.prisma.attendanceRecord.update({
      where: { id },
      data,
      select: attendanceSelect,
    });

    return serializeAttendance(record);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.attendanceRecord.delete({ where: { id } });
    return { success: true };
  }

  private async ensureUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Employee not found');
    }
  }
}

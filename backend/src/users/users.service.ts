import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  isAdmin: true,
  isActive: true,
  createdAt: true,
  workScheduleId: true,
  workSchedule: {
    select: { id: true, name: true },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const normalizedSearch = search?.trim();

    return this.prisma.user.findMany({
      where: normalizedSearch
        ? {
            OR: [
              { name: { contains: normalizedSearch } },
              { email: { contains: normalizedSearch } },
            ],
          }
        : undefined,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findSchedules() {
    return this.prisma.workSchedule.findMany({
      select: { id: true, name: true, startTime: true, endTime: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        isAdmin: false,
        isActive: dto.isActive ?? false,
      },
      select: userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    if (id === actorId && dto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    if (id === actorId && dto.isAdmin === false) {
      throw new ForbiddenException('You cannot remove your own administrator access');
    }

    const email = dto.email?.trim().toLowerCase();
    if (email && email !== existing.email) {
      const emailOwner = await this.prisma.user.findUnique({ where: { email } });
      if (emailOwner) {
        throw new ConflictException('An account with this email already exists');
      }
    }

    if (dto.workScheduleId) {
      const schedule = await this.prisma.workSchedule.findUnique({
        where: { id: dto.workScheduleId },
      });

      if (!schedule) {
        throw new NotFoundException('Work schedule not found');
      }
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 12)
      : undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        email,
        passwordHash,
        isActive: dto.isActive,
        isAdmin: dto.isAdmin,
        workScheduleId: dto.workScheduleId,
      },
      select: userSelect,
    });
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}

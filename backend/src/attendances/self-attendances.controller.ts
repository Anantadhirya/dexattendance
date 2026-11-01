import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';
import { ActiveGuard } from '../auth/active.guard.js';
import { CreateSelfAttendanceDto } from './dto/create-self-attendance.dto.js';
import { AttendancesService } from './attendances.service.js';

type AuthenticatedRequest = Request & { userId: string };

@Controller('my-attendances')
@UseGuards(AuthGuard, ActiveGuard)
export class SelfAttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get('today')
  findToday(
    @Req() request: AuthenticatedRequest,
    @Query('timezoneOffsetMinutes') timezoneOffsetMinutes?: string,
  ) {
    const parsedOffset = Number(timezoneOffsetMinutes);
    return this.attendancesService.findTodayForUser(
      request.userId,
      Number.isFinite(parsedOffset) ? parsedOffset : 0,
    );
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendancesService.findForUser(
      request.userId,
      startDate,
      endDate,
    );
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateSelfAttendanceDto,
  ) {
    return this.attendancesService.createForUser(request.userId, dto);
  }
}

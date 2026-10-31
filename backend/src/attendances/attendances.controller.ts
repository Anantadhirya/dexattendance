import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import { AttendancesService } from './attendances.service.js';

@Controller('attendances')
@UseGuards(AuthGuard, AdminGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') pageValue?: string,
    @Query('pageSize') pageSizeValue?: string,
  ) {
    const page = Math.max(1, Number.parseInt(pageValue ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(pageSizeValue ?? '10', 10) || 10),
    );
    return this.attendancesService.findAll(
      search,
      startDate,
      endDate,
      page,
      pageSize,
    );
  }

  @Get('user/:userId')
  findForUser(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendancesService.findForUser(userId, startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendancesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendancesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}

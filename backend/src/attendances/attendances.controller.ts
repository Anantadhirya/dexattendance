import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  findAll() {
    return this.attendancesService.findAll();
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

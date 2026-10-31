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
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto.js';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto.js';
import { WorkSchedulesService } from './work-schedules.service.js';

@Controller('work-schedules')
@UseGuards(AuthGuard, AdminGuard)
export class WorkSchedulesController {
  constructor(private readonly workSchedulesService: WorkSchedulesService) {}

  @Get()
  findAll() {
    return this.workSchedulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workSchedulesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWorkScheduleDto) {
    return this.workSchedulesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkScheduleDto) {
    return this.workSchedulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workSchedulesService.remove(id);
  }
}

import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

type AuthenticatedRequest = Request & { userId: string };

@Controller('users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') pageValue?: string,
    @Query('pageSize') pageSizeValue?: string,
  ) {
    const page = Math.max(1, Number.parseInt(pageValue ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(pageSizeValue ?? '10', 10) || 10),
    );
    return this.usersService.findAll(search, page, pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.update(id, dto, request.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.remove(id, request.userId);
  }
}

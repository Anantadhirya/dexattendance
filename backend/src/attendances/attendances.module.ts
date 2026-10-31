import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AttendancesController } from './attendances.controller.js';
import { AttendancesService } from './attendances.service.js';
import { SelfAttendancesController } from './self-attendances.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AttendancesController, SelfAttendancesController],
  providers: [AttendancesService],
})
export class AttendancesModule {}

// src/attendance/attendance.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { DashboardModule } from "../dashboard/dashboard.module";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";

@Module({
  imports: [PrismaModule, DashboardModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
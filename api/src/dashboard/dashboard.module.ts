// src/dashboard/dashboard.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardGateway } from "./dashboard.gateway";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}
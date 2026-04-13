import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccessControlModule } from "../access-control/access-control.module";
import { AcademicPeriodsController } from "./academic-periods.controller";
import { AcademicPeriodsService } from "./academic-periods.service";

@Module({
  imports: [PrismaModule, AccessControlModule],
  controllers: [AcademicPeriodsController],
  providers: [AcademicPeriodsService],
  exports: [AcademicPeriodsService],
})
export class AcademicPeriodsModule {}
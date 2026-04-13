import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccessControlModule } from "../access-control/access-control.module";
import { ProgramsController } from "./programs.controller";
import { ProgramsService } from "./programs.service";

@Module({
  imports: [PrismaModule, AccessControlModule],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
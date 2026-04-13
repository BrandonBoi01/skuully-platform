import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccessControlModule } from "../access-control/access-control.module";
import { SubjectsController } from "./subjects.controller";
import { SubjectsService } from "./subjects.service";

@Module({
  imports: [PrismaModule, AccessControlModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
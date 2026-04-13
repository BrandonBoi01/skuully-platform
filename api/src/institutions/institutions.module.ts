import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccessControlModule } from "../access-control/access-control.module";
import { InstitutionsController, MembershipInvitesController } from "./institutions.controller";
import { InstitutionsService } from "./institutions.service";
import { InstitutionAccessSetupService } from "./institution-access-setup.service";

@Module({
  imports: [PrismaModule, AccessControlModule],
  controllers: [InstitutionsController, MembershipInvitesController],
  providers: [InstitutionsService, InstitutionAccessSetupService],
  exports: [InstitutionsService, InstitutionAccessSetupService],
})
export class InstitutionsModule {}
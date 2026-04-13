import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccessControlService } from "./access-control.service";
import { PermissionsGuard } from "./permissions.guard";

@Module({
  imports: [PrismaModule],
  providers: [AccessControlService, PermissionsGuard],
  exports: [AccessControlService, PermissionsGuard],
})
export class AccessControlModule {}
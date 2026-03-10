import { Module } from "@nestjs/common";
import { SchoolsController } from "./schools.controller";
import { SchoolsService } from "./schools.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 🔥 reuse JWT + guards from AuthModule
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { SchoolsModule } from "./schools/schools.module";
import { ProgramsModule } from "./programs/programs.module";
import { StudentsModule } from "./students/students.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { GeoModule } from "./geo/geo.module";
import { OnboardingModule } from "./onboarding/onboarding.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 20,
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    SchoolsModule,
    ProgramsModule,
    StudentsModule,
    AttendanceModule,
    DashboardModule,
    GeoModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
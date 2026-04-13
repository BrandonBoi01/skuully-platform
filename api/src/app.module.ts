import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { GeoModule } from "./geo/geo.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { AccessControlModule } from "./access-control/access-control.module";
import { InstitutionsModule } from "./institutions/institutions.module";
import { ProgramsModule } from "./programs/programs.module";
import { SubjectsModule } from "./subjects/subjects.module";
import { StudentsModule } from "./students/students.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { AcademicPeriodsModule } from "./academic-periods/academic-periods.module";

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
    GeoModule,
    OnboardingModule,
    AccessControlModule,
    InstitutionsModule,
    ProgramsModule,
    SubjectsModule,
    StudentsModule,
    EnrollmentsModule,
    AcademicPeriodsModule,
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
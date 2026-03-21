import { Module } from "@nestjs/common";

import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { PrismaService } from "../prisma/prisma.service";
import { SmsModule } from "../shared/sms/sms.module";
import { SchoolsModule } from "../schools/schools.module";

@Module({
  imports: [SmsModule, SchoolsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, PrismaService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
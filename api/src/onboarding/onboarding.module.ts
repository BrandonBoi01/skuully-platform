import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SchoolsModule } from "../schools/schools.module";
import { SmsService } from "../shared/sms/sms.service";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  imports: [SchoolsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, PrismaService, SmsService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
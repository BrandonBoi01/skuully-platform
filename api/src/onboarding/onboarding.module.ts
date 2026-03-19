import { Module, forwardRef } from "@nestjs/common";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { PrismaService } from "../prisma/prisma.service";
import { SmsService } from "../shared/sms/sms.service";
import { SchoolsModule } from "../schools/schools.module";

@Module({
  imports: [forwardRef(() => SchoolsModule)],
  controllers: [OnboardingController],
  providers: [OnboardingService, PrismaService, SmsService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
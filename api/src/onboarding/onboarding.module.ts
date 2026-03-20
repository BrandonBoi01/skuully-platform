import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { SchoolsModule } from "../schools/schools.module";
import { SharedModule } from "../shared/shared.module";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  imports: [PrismaModule, SharedModule, SchoolsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
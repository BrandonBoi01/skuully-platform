import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import { OnboardingService } from "./onboarding.service";
import { StartOnboardingDto } from "./dto/start-onboarding.dto";
import { SetProfileDto } from "./dto/set-profile.dto";
import { CreateInstitutionOnboardingDto } from "./dto/create-institution-onboarding.dto";
import { RequestJoinDto } from "./dto/request-join.dto";

@UseGuards(JwtAuthGuard)
@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get("me")
  getStatus(@Req() req: any) {
    return this.onboarding.getStatus(req.user.userId);
  }

  @Post("start")
  start(@Req() req: any, @Body() dto: StartOnboardingDto) {
    return this.onboarding.start(req.user.userId, dto);
  }

  @Post("profile")
  setProfile(@Req() req: any, @Body() dto: SetProfileDto) {
    return this.onboarding.setProfile(req.user.userId, dto);
  }

  @Post("institution")
  createInstitution(
    @Req() req: any,
    @Body() dto: CreateInstitutionOnboardingDto
  ) {
    return this.onboarding.createInstitution(req.user.userId, dto);
  }

  @Post("join")
  requestJoin(@Req() req: any, @Body() dto: RequestJoinDto) {
    return this.onboarding.requestJoin(req.user.userId, dto);
  }
}
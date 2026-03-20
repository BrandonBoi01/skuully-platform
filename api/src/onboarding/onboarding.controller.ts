import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OnboardingService } from "./onboarding.service";
import { SetOnboardingRouteDto } from "./dto/set-onboarding-route.dto";
import { SaveBuildIdentityDto } from "./dto/save-build-identity.dto";
import { SaveBuildAcademicDto } from "./dto/save-build-academic.dto";
import { SaveBuildDetailsDto } from "./dto/save-build-details.dto";
import { SendPhoneCodeDto } from "./dto/send-phone-code.dto";
import { VerifyPhoneCodeDto } from "./dto/verify-phone-code.dto";

@Controller("onboarding")
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get("me")
  getMyOnboarding(@Req() req: any) {
    return this.onboardingService.getMyOnboarding(req.user.id);
  }

  @Post("route")
  setRoute(@Req() req: any, @Body() dto: SetOnboardingRouteDto) {
    return this.onboardingService.setRoute(req.user.id, dto);
  }

  @Post("build/identity")
  saveBuildIdentity(@Req() req: any, @Body() dto: SaveBuildIdentityDto) {
    return this.onboardingService.saveBuildIdentity(req.user.id, dto);
  }

  @Get("build/academic-options")
  getAcademicOptions(
    @Query("institutionType") institutionType: string,
    @Query("countryCode") countryCode: string
  ) {
    return this.onboardingService.getAcademicOptions(
      institutionType,
      countryCode
    );
  }

  @Post("build/academic")
  saveBuildAcademic(@Req() req: any, @Body() dto: SaveBuildAcademicDto) {
    return this.onboardingService.saveBuildAcademic(req.user.id, dto);
  }

  @Get("build/detail-options")
  getDetailOptions(@Query("institutionType") institutionType: string) {
    return this.onboardingService.getDetailOptions(institutionType);
  }

  @Post("build/details")
  saveBuildDetails(@Req() req: any, @Body() dto: SaveBuildDetailsDto) {
    return this.onboardingService.saveBuildDetails(req.user.id, dto);
  }

  @Post("build/phone/send-code")
  sendPhoneCode(@Req() req: any, @Body() dto: SendPhoneCodeDto) {
    return this.onboardingService.sendPhoneCode(req.user.id, dto);
  }

  @Post("build/phone/verify")
  verifyPhoneCode(@Req() req: any, @Body() dto: VerifyPhoneCodeDto) {
    return this.onboardingService.verifyPhoneCode(req.user.id, dto);
  }

  @Post("build/phone/skip")
  skipPhone(@Req() req: any) {
    return this.onboardingService.skipPhone(req.user.id);
  }

  @Get("build/review")
  getBuildReview(@Req() req: any) {
    return this.onboardingService.getBuildReview(req.user.id);
  }

  @Post("build/complete")
  completeBuildInstitution(@Req() req: any) {
    return this.onboardingService.completeBuildInstitution(req.user.id);
  }
}
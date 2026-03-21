import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { OnboardingService } from "./onboarding.service";
import { SetOnboardingRouteDto } from "./dto/set-onboarding-route.dto";
import { SaveBuildIdentityDto } from "./dto/save-build-identity.dto";
import { SaveBuildAcademicDto } from "./dto/save-build-academic.dto";
import { SaveBuildDetailsDto } from "./dto/save-build-details.dto";
import { SendPhoneCodeDto } from "./dto/send-phone-code.dto";
import { VerifyPhoneCodeDto } from "./dto/verify-phone-code.dto";

@Controller("onboarding")
@UseGuards(AuthGuard("jwt"))
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get("me")
  getMyOnboarding(@Req() req: any) {
    return this.onboardingService.getMyOnboarding(req.user.userId);
  }

  @Post("route")
  setRoute(@Req() req: any, @Body() dto: SetOnboardingRouteDto) {
    return this.onboardingService.setRoute(req.user.userId, dto);
  }

  @Post("build/identity")
  saveBuildIdentity(@Req() req: any, @Body() dto: SaveBuildIdentityDto) {
    return this.onboardingService.saveBuildIdentity(req.user.userId, dto);
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
    return this.onboardingService.saveBuildAcademic(req.user.userId, dto);
  }

  @Get("build/detail-options")
  getDetailOptions(@Query("institutionType") institutionType: string) {
    return this.onboardingService.getDetailOptions(institutionType);
  }

  @Post("build/details")
  saveBuildDetails(@Req() req: any, @Body() dto: SaveBuildDetailsDto) {
    return this.onboardingService.saveBuildDetails(req.user.userId, dto);
  }

  @Post("build/security/send-phone-code")
  sendPhoneCode(@Req() req: any, @Body() dto: SendPhoneCodeDto) {
    return this.onboardingService.sendPhoneCode(req.user.userId, dto);
  }

  @Post("build/security/verify-phone-code")
  verifyPhoneCode(@Req() req: any, @Body() dto: VerifyPhoneCodeDto) {
    return this.onboardingService.verifyPhoneCode(req.user.userId, dto);
  }

  @Post("build/security/skip")
  skipPhone(@Req() req: any) {
    return this.onboardingService.skipPhone(req.user.userId);
  }

  @Get("build/review")
  getBuildReview(@Req() req: any) {
    return this.onboardingService.getBuildReview(req.user.userId);
  }

  @Post("build/complete")
  completeBuildInstitution(@Req() req: any) {
    return this.onboardingService.completeBuildInstitution(req.user.userId);
  }
}
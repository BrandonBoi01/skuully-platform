import {
  Body,
  Controller,
  Get,
  Post,
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
  constructor(private readonly onboarding: OnboardingService) {}

  @Get("me")
  getMyOnboarding(@Req() req: any) {
    return this.onboarding.getMyOnboarding(req.user.userId);
  }

  @Post("route")
  setRoute(@Req() req: any, @Body() dto: SetOnboardingRouteDto) {
    return this.onboarding.setRoute(req.user.userId, dto);
  }

  @Post("build/identity")
  saveBuildIdentity(@Req() req: any, @Body() dto: SaveBuildIdentityDto) {
    return this.onboarding.saveBuildIdentity(req.user.userId, dto);
  }

  @Get("build/academic-options")
  getAcademicOptions(@Req() req: any) {
    const institutionType = req.query.institutionType;
    const countryCode = req.query.countryCode;

    return this.onboarding.getAcademicOptions(
      institutionType,
      countryCode
    );
  }

  @Post("build/academic")
  saveBuildAcademic(@Req() req: any, @Body() dto: SaveBuildAcademicDto) {
    return this.onboarding.saveBuildAcademic(req.user.userId, dto);
  }

  @Get("build/detail-options")
  getDetailOptions(@Req() req: any) {
    const institutionType = req.query.institutionType;
    return this.onboarding.getDetailOptions(institutionType);
  }

  @Post("build/details")
  saveBuildDetails(@Req() req: any, @Body() dto: SaveBuildDetailsDto) {
    return this.onboarding.saveBuildDetails(req.user.userId, dto);
  }

  @Post("build/phone/send-code")
  sendPhoneCode(@Req() req: any, @Body() dto: SendPhoneCodeDto) {
    return this.onboarding.sendPhoneCode(req.user.userId, dto);
  }

  @Post("build/phone/verify-code")
  verifyPhoneCode(@Req() req: any, @Body() dto: VerifyPhoneCodeDto) {
    return this.onboarding.verifyPhoneCode(req.user.userId, dto);
  }

  @Post("build/phone/skip")
  skipPhone(@Req() req: any) {
    return this.onboarding.skipPhone(req.user.userId);
  }

  @Get("build/review")
  getBuildReview(@Req() req: any) {
    return this.onboarding.getBuildReview(req.user.userId);
  }

  @Post("build/complete")
  completeBuildInstitution(@Req() req: any) {
    return this.onboarding.completeBuildInstitution(req.user.userId);
  }
}
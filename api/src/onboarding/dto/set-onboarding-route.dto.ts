import { IsEnum } from "class-validator";
import { OnboardingRoute } from "@prisma/client";

export class SetOnboardingRouteDto {
  @IsEnum(OnboardingRoute)
  route: OnboardingRoute;
}
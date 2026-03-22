import { IsEnum, IsOptional } from "class-validator";
import { AccountIntent, OnboardingRoute } from "@prisma/client";

export class SetOnboardingRouteDto {
  @IsEnum(OnboardingRoute)
  route: OnboardingRoute;

  @IsOptional()
  @IsEnum(AccountIntent)
  accountIntent?: AccountIntent;
}
import { AccountIntent } from "@prisma/client";
import { IsEnum } from "class-validator";

export class StartOnboardingDto {
  @IsEnum(AccountIntent)
  accountIntent: AccountIntent;
}
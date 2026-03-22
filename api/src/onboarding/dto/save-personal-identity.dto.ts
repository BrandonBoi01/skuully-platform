import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { AccountIntent } from "@prisma/client";

export class SavePersonalIdentityDto {
  @IsString()
  @MinLength(3)
  skuullyId: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEnum(AccountIntent)
  accountIntent: AccountIntent;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
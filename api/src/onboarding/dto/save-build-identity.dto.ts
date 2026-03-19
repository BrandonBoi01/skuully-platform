import { IsEnum, IsString, MinLength } from "class-validator";
import { InstitutionType } from "@prisma/client";

export class SaveBuildIdentityDto {
  @IsEnum(InstitutionType)
  institutionType: InstitutionType;

  @IsString()
  @MinLength(2)
  institutionName: string;

  @IsString()
  @MinLength(2)
  country: string;

  @IsString()
  @MinLength(2)
  countryCode: string;
}
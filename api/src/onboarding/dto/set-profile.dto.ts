import { IsOptional, IsString, MaxLength, MinLength, Matches } from "class-validator";

export class SetProfileDto {
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: "nationalityCode must be a valid 2-letter country code",
  })
  nationalityCode: string;

  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: "residenceCountryCode must be a valid 2-letter country code",
  })
  residenceCountryCode: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  headline?: string;
}
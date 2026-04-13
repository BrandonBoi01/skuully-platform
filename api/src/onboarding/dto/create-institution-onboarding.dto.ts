import {
  GenderAdmissionPolicy,
  InstitutionCategory,
  InstitutionType,
  LearningMode,
} from "@prisma/client";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateInstitutionOnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsEnum(InstitutionType)
  institutionType: InstitutionType;

  @IsOptional()
  @IsEnum(InstitutionCategory)
  institutionCategory?: InstitutionCategory;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  legalName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  primaryPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: "countryCode must be a valid 2-letter country code",
  })
  countryCode?: string;

  @IsOptional()
  @IsString()
  subdivisionId?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownership?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  levelType?: string;

  @IsOptional()
  @IsEnum(GenderAdmissionPolicy)
  genderAdmissionPolicy?: GenderAdmissionPolicy;

  @IsOptional()
  @IsArray()
  @IsEnum(LearningMode, { each: true })
  learningModes?: LearningMode[];
}
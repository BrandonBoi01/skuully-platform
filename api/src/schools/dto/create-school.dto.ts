import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  GenderAdmissionPolicy,
  InstitutionType,
  LearningMode,
} from "@prisma/client";

class AcademicSetupDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedItems?: string[];

  @IsOptional()
  @IsBoolean()
  setUpLater?: boolean;
}

class InstitutionProfileDto {
  @IsOptional()
  @IsArray()
  @IsEnum(LearningMode, { each: true })
  learningModes?: LearningMode[];

  @IsOptional()
  @IsEnum(GenderAdmissionPolicy)
  genderAdmissionPolicy?: GenderAdmissionPolicy;

  @IsOptional()
  @IsString()
  ownership?: string;

  @IsOptional()
  @IsString()
  levelType?: string;
}

class SecurityPhoneDto {
  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  dialCode?: string;

  @IsOptional()
  @IsString()
  nationalNumber?: string;

  @IsOptional()
  @IsString()
  e164?: string;
}

class SecuritySetupDto {
  @IsOptional()
  @IsBoolean()
  addPhoneLater?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SecurityPhoneDto)
  phone?: SecurityPhoneDto | null;
}

export class CreateSchoolDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  country: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  curriculumName?: string;

  @IsOptional()
  @IsString()
  curriculumCode?: string;

  @IsOptional()
  @IsString()
  organizationName?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsEnum(InstitutionType)
  institutionType?: InstitutionType;

  @IsOptional()
  @ValidateNested()
  @Type(() => AcademicSetupDto)
  academicSetup?: AcademicSetupDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InstitutionProfileDto)
  institutionProfile?: InstitutionProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySetupDto)
  security?: SecuritySetupDto;
}
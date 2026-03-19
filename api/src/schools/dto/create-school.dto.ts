import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { InstitutionType } from "@prisma/client";

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
  @IsString()
  learningMode?: string;

  @IsOptional()
  @IsString()
  ownership?: string;

  @IsOptional()
  @IsString()
  levelType?: string;
}

class PhoneDto {
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

class SecurityDto {
  @IsOptional()
  @IsBoolean()
  addPhoneLater?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneDto)
  phone?: PhoneDto | null;
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
  @IsArray()
  @IsString({ each: true })
  curricula?: string[];

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
  @Type(() => SecurityDto)
  security?: SecurityDto;
}
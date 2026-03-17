import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { InstitutionType } from "@prisma/client";

export class CreateSchoolDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  country: string;

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
}
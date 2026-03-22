import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { SchoolJoinRequestType } from "@prisma/client";

export class CreateSchoolJoinRequestDto {
  @IsString()
  schoolId: string;

  @IsEnum(SchoolJoinRequestType)
  type: SchoolJoinRequestType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  studentFullName?: string;

  @IsOptional()
  @IsString()
  admissionNo?: string;

  @IsOptional()
  @IsString()
  staffNo?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
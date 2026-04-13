import { EnrollmentType } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateStudentEnrollmentDto {
  @IsString()
  programId: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  academicYear?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  termLabel?: string;

  @IsOptional()
  @IsEnum(EnrollmentType)
  enrollmentType?: EnrollmentType;

  @IsOptional()
  @IsDateString()
  admittedAt?: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
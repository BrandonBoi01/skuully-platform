import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class PromoteStudentDto {
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

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
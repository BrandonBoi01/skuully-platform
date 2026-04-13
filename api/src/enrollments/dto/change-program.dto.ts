import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class ChangeProgramDto {
  @IsString()
  programId: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class WithdrawStudentDto {
  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
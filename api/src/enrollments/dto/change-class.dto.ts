import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class ChangeClassDto {
  @IsString()
  classId: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
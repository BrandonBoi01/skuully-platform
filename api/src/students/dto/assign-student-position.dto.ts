import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class AssignStudentPositionDto {
  @IsString()
  positionDefinitionId: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
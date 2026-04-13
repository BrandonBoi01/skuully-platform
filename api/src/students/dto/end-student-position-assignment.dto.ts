import { StudentPositionStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class EndStudentPositionAssignmentDto {
  @IsOptional()
  @IsEnum(StudentPositionStatus)
  status?: StudentPositionStatus;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
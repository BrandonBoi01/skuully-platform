import { InstitutionJoinRequestStatus } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class ReviewJoinRequestDto {
  @IsEnum(InstitutionJoinRequestStatus)
  status: InstitutionJoinRequestStatus;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  note?: string;
}
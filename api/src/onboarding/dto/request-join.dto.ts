import { InstitutionJoinRequestType } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RequestJoinDto {
  @IsString()
  institutionId: string;

  @IsEnum(InstitutionJoinRequestType)
  requestType: InstitutionJoinRequestType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  admissionNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  staffNo?: string;
}
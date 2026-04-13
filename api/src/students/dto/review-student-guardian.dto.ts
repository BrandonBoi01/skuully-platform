import { RelationshipStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewStudentGuardianDto {
  @IsEnum(RelationshipStatus)
  status: RelationshipStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
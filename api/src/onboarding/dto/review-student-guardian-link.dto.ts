import { IsEnum } from "class-validator";
import { RelationshipStatus } from "@prisma/client";

export class ReviewStudentGuardianLinkDto {
  @IsEnum(RelationshipStatus)
  status: RelationshipStatus;
}
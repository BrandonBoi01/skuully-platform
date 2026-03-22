import { IsEnum, IsOptional, IsString } from "class-validator";
import { SchoolJoinRequestStatus } from "@prisma/client";

export class ReviewSchoolJoinRequestDto {
  @IsEnum(SchoolJoinRequestStatus)
  status: SchoolJoinRequestStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
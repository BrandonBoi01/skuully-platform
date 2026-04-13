import { InstitutionJoinRequestStatus, InstitutionJoinRequestType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ListJoinRequestsDto {
  @IsOptional()
  @IsEnum(InstitutionJoinRequestStatus)
  status?: InstitutionJoinRequestStatus;

  @IsOptional()
  @IsEnum(InstitutionJoinRequestType)
  requestType?: InstitutionJoinRequestType;
}
import { AcademicPeriodStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class CloseAcademicPeriodDto {
  @IsOptional()
  @IsEnum(AcademicPeriodStatus)
  status?: AcademicPeriodStatus;
}
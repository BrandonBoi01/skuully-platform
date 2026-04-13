import {
  AcademicPeriodStatus,
  AcademicPeriodType,
} from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListAcademicPeriodsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AcademicPeriodType)
  type?: AcademicPeriodType;

  @IsOptional()
  @IsEnum(AcademicPeriodStatus)
  status?: AcademicPeriodStatus;

  @IsOptional()
  @IsString()
  parentPeriodId?: string;

  @IsOptional()
  @IsString()
  academicYearLabel?: string;
}
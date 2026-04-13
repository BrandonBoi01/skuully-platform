import {
  AcademicPeriodStatus,
  AcademicPeriodType,
} from "@prisma/client";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpdateAcademicPeriodDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string | null;

  @IsOptional()
  @IsEnum(AcademicPeriodType)
  type?: AcademicPeriodType;

  @IsOptional()
  @IsEnum(AcademicPeriodStatus)
  status?: AcademicPeriodStatus;

  @IsOptional()
  @IsString()
  parentPeriodId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  academicYearLabel?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  termNumber?: number | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
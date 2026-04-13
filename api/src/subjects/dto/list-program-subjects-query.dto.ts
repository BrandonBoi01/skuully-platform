import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ListProgramSubjectsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCore?: boolean;
}
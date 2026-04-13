import { ProgramStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListProgramsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}
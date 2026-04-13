import { ProgramStatus } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateProgramDto {
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
  @IsString()
  templateId?: string | null;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}
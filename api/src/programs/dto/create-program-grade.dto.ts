import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateProgramGradeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsOptional()
  @IsString()
  templateGradeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stage?: string;
}
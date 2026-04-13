import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class UpdateProgramGradeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  templateGradeId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stage?: string | null;
}
import { IsOptional, IsString } from "class-validator";

export class ListCitiesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  subdivisionId?: string;
}
import { IsOptional, IsString } from "class-validator";

export class ListCountriesQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
import { IsBooleanString, IsOptional, IsString } from "class-validator";

export class ListCountriesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsBooleanString()
  activeOnly?: string;
}
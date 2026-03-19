import { IsOptional, IsString } from "class-validator";

export class GetGeoCountriesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  subregion?: string;
}
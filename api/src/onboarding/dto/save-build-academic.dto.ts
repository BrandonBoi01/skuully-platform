import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

export class SaveBuildAcademicDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsArray()
  @IsString({ each: true })
  selectedItems: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCodes?: string[];

  @IsBoolean()
  setUpLater: boolean;
}
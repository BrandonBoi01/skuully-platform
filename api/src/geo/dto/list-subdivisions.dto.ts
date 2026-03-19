import { IsOptional, IsString } from "class-validator";

export class ListSubdivisionsDto {
  @IsOptional()
  @IsString()
  q?: string;
}
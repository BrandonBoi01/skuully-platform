import { IsOptional, IsString } from "class-validator";

export class ListClassRoomsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
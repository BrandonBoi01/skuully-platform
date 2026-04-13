import { IsBoolean, IsOptional } from "class-validator";

export class SetPrimaryGuardianDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
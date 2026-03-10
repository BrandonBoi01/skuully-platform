// src/schools/dto/accept-invite.dto.ts
import { IsString, MinLength } from "class-validator";

export class AcceptInviteDto {
  @IsString()
  code: string;

  @IsString()
  fullName: string;

  @IsString()
  @MinLength(6)
  password: string;
}
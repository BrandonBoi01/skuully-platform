import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SocialAuthDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;
}
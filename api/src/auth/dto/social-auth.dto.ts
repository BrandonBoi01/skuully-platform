import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SocialAuthDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value
  )
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  idToken!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;
}
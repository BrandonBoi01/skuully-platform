import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value
  )
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  identifier!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
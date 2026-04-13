import { Transform } from "class-transformer";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value
  )
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, {
    message: "password must contain at least one uppercase letter",
  })
  @Matches(/[a-z]/, {
    message: "password must contain at least one lowercase letter",
  })
  @Matches(/\d/, {
    message: "password must contain at least one number",
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: "password must contain at least one special character",
  })
  password!: string;
}
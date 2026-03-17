import { IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "password must contain at least one uppercase letter" })
  @Matches(/[a-z]/, { message: "password must contain at least one lowercase letter" })
  @Matches(/\d/, { message: "password must contain at least one number" })
  password: string;
}
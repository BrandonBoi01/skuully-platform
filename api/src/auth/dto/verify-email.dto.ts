import { Transform } from "class-transformer";
import { IsEmail, IsString, Length, MaxLength, Matches } from "class-validator";

export class VerifyEmailDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value
  )
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: "code must be a 6-digit number",
  })
  code!: string;
}
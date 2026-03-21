import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
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
  password: string;
}
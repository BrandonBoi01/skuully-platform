import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  schoolName: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
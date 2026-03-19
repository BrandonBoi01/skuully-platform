import { IsString, Length } from "class-validator";

export class VerifyPhoneCodeDto {
  @IsString()
  e164: string;

  @IsString()
  @Length(4, 8)
  code: string;
}
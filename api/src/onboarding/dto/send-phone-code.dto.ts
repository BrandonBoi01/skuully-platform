import { IsString } from "class-validator";

export class SendPhoneCodeDto {
  @IsString()
  countryCode: string;

  @IsString()
  dialCode: string;

  @IsString()
  nationalNumber: string;

  @IsString()
  e164: string;
}
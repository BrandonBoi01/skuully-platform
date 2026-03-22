import { IsBoolean } from "class-validator";

export class CompletePersonalAccountDto {
  @IsBoolean()
  confirm: boolean;
}
import { IsString } from "class-validator";

export class AcceptSchoolInviteDto {
  @IsString()
  code: string;
}
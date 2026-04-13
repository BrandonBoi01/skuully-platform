import { IsString, Length } from "class-validator";

export class AcceptMembershipInviteDto {
  @IsString()
  @Length(8, 128)
  code: string;
}
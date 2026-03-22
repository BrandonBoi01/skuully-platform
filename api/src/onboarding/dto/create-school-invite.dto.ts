import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { MembershipType } from "@prisma/client";

export class CreateSchoolInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(MembershipType)
  membershipType: MembershipType;

  @IsOptional()
  @IsString()
  roleId?: string;
}
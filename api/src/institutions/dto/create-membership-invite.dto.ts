import { MembershipType } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateMembershipInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(MembershipType)
  membershipType: MembershipType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
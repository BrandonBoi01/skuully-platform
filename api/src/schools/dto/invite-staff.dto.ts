import { IsEmail, IsEnum } from "class-validator";
import { SchoolRole } from "@prisma/client";

export class InviteStaffDto {
  @IsEmail()
  email: string;

  @IsEnum(SchoolRole)
  role: SchoolRole;
}
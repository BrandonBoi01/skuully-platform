import { IsString } from "class-validator";

export class AssignRoleDto {
  @IsString()
  membershipId: string;

  @IsString()
  roleId: string;
}
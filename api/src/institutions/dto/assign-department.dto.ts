import { IsString } from "class-validator";

export class AssignDepartmentDto {
  @IsString()
  membershipId: string;

  @IsString()
  departmentId: string;
}
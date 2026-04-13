import { IsBoolean } from "class-validator";

export class SetCurrentAcademicPeriodDto {
  @IsBoolean()
  isCurrent: boolean;
}
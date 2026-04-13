import { IsString } from "class-validator";

export class AssignSubjectToGradeDto {
  @IsString()
  subjectId: string;
}
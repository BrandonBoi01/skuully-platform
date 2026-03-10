import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateStudentDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  admissionNo?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dob?: string; // ISO string (we'll parse)

  @IsOptional()
  @IsString()
  classId?: string;

  // dynamic fields by key e.g. { nemisNumber: "123" }
  @IsOptional()
  @IsObject()
  fields?: Record<string, string>;
}
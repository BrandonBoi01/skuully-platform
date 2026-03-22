import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { RelationshipType } from "@prisma/client";

export class CreateStudentGuardianLinkDto {
  @IsString()
  schoolId: string;

  @IsString()
  studentId: string;

  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  canPickUp?: boolean;

  @IsOptional()
  @IsBoolean()
  canReceiveUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  canPayFees?: boolean;
}
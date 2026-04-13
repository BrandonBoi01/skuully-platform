import { RelationshipStatus, RelationshipType } from "@prisma/client";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateStudentGuardianDto {
  @IsOptional()
  @IsString()
  guardianUserId?: string;

  @IsOptional()
  @IsString()
  studentUserId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @IsOptional()
  @IsEnum(RelationshipStatus)
  status?: RelationshipStatus;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  canReceiveUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  canPayFees?: boolean;

  @IsOptional()
  @IsBoolean()
  canPickUp?: boolean;
}
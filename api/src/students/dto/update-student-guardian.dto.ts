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

export class UpdateStudentGuardianDto {
  @IsOptional()
  @IsString()
  guardianUserId?: string | null;

  @IsOptional()
  @IsString()
  studentUserId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @IsEnum(RelationshipType)
  relationshipType?: RelationshipType;

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
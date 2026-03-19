import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { GenderAdmissionPolicy, LearningMode } from "@prisma/client";

export class SaveBuildDetailsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(LearningMode, { each: true })
  learningModes: LearningMode[];

  @IsOptional()
  @IsEnum(GenderAdmissionPolicy)
  genderAdmissionPolicy?: GenderAdmissionPolicy;

  @IsOptional()
  @IsString()
  ownership?: string;

  @IsOptional()
  @IsString()
  levelType?: string;
}
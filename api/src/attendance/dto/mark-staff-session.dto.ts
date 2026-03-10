// src/attendance/dto/mark-staff-session.dto.ts
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";
import { Type } from "class-transformer";
import { AttendanceStatus } from "@prisma/client";

/**
 * Ensures marks[].staffId is unique in a single request.
 */
function UniqueBy(
  key: (obj: any) => string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "UniqueBy",
      target: object.constructor,
      propertyName,
      constraints: [key],
      options: validationOptions,
      validator: {
        validate(value: any[], args: ValidationArguments) {
          if (!Array.isArray(value)) return false;
          const getter = args.constraints[0] as (obj: any) => string;
          const seen = new Set<string>();
          for (const item of value) {
            const k = getter(item);
            if (!k) return false;
            if (seen.has(k)) return false;
            seen.add(k);
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains duplicate staffId values`;
        },
      },
    });
  };
}

export class StaffMarkRowDto {
  @IsString()
  staffId!: string;

  @IsEnum(AttendanceStatus, {
    message: `status must be one of: ${Object.values(AttendanceStatus).join(", ")}`,
  })
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class MarkStaffSessionDto {
  @IsArray()
  @ArrayMinSize(1, { message: "marks must contain at least 1 row" })
  @ValidateNested({ each: true })
  @Type(() => StaffMarkRowDto)
  @UniqueBy((row: StaffMarkRowDto) => row.staffId, {
    message: "marks contains duplicate staffId values",
  })
  marks!: StaffMarkRowDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}
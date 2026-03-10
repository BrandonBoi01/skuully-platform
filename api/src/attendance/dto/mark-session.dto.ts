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
 * Ensures marks[].studentId is unique in a single request.
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
          return `${args.property} contains duplicate studentId values`;
        },
      },
    });
  };
}

export class MarkRowDto {
  @IsString()
  studentId!: string;

  @IsEnum(AttendanceStatus, {
    message: `status must be one of: ${Object.values(AttendanceStatus).join(", ")}`,
  })
  status!: AttendanceStatus;

  /**
   * UI note (optional). Good for teacher comments like "Came late due to bus".
   */
  @IsOptional()
  @IsString()
  note?: string;

  /**
   * Audit reason (optional). Use when overriding locked/second-change policy,
   * or when you want explicit justification in history.
   */
  @IsOptional()
  @IsString()
  reason?: string;
}

export class MarkAttendanceSessionDto {
  /**
   * Optional batch-level reason applied when individual rows don't provide one.
   * (Service picks row.reason > dto.reason > row.note)
   */
  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "marks must contain at least 1 row" })
  @ValidateNested({ each: true })
  @Type(() => MarkRowDto)
  @UniqueBy((row: MarkRowDto) => row.studentId, {
    message: "marks contains duplicate studentId values",
  })
  marks!: MarkRowDto[];
}
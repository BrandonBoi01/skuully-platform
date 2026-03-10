// src/attendance/dto/create-event.dto.ts
import { IsEnum, IsISO8601, IsObject, IsOptional, IsString } from "class-validator";
import { AttendanceEventType, AttendancePersonType, AttendanceSource } from "@prisma/client";

export class CreateAttendanceEventDto {
  @IsEnum(AttendancePersonType)
  personType!: AttendancePersonType;

  @IsString()
  personId!: string;

  @IsEnum(AttendanceEventType)
  eventType!: AttendanceEventType;

  @IsEnum(AttendanceSource)
  source!: AttendanceSource;

  @IsISO8601()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsObject()
  metaJson?: Record<string, any>;
}
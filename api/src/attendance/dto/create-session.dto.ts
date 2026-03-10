import { IsOptional, IsString, Matches } from "class-validator";

export class CreateAttendanceSessionDto {
  @IsString()
  classId!: string;

  /**
   * Accepts:
   * - "YYYY-MM-DD"
   * - Full ISO date-time string
   *
   * We normalize to UTC day-start in service.
   */
  @Matches(/^\d{4}-\d{2}-\d{2}$|^\d{4}-\d{2}-\d{2}T.+$/, {
    message: "date must be 'YYYY-MM-DD' or a valid ISO datetime string",
  })
  date!: string;

  @IsOptional()
  @IsString()
  periodName?: string;
}
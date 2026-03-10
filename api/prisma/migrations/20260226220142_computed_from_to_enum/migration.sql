-- 1) Create enums if they don't exist (safe rerun)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DailyAttendanceComputedFrom') THEN
    CREATE TYPE "DailyAttendanceComputedFrom" AS ENUM ('MANUAL', 'EVENTS', 'MIXED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DailyAttendanceChangeType') THEN
    CREATE TYPE "DailyAttendanceChangeType" AS ENUM ('STATUS', 'LOCK', 'UNLOCK', 'TIMES', 'SYSTEM');
  END IF;
END $$;

-- 2) DailyAttendance.computedFrom: text -> enum (NO drop)
ALTER TABLE "DailyAttendance"
  ALTER COLUMN "computedFrom" DROP DEFAULT;

ALTER TABLE "DailyAttendance"
  ALTER COLUMN "computedFrom"
  TYPE "DailyAttendanceComputedFrom"
  USING ("computedFrom"::"DailyAttendanceComputedFrom");

ALTER TABLE "DailyAttendance"
  ALTER COLUMN "computedFrom" SET DEFAULT 'MANUAL'::"DailyAttendanceComputedFrom";

-- 3) DailyAttendanceChange.changeType: text -> enum (NO drop)
ALTER TABLE "DailyAttendanceChange"
  ALTER COLUMN "changeType" DROP DEFAULT;

ALTER TABLE "DailyAttendanceChange"
  ALTER COLUMN "changeType"
  TYPE "DailyAttendanceChangeType"
  USING ("changeType"::"DailyAttendanceChangeType");

ALTER TABLE "DailyAttendanceChange"
  ALTER COLUMN "changeType" SET DEFAULT 'STATUS'::"DailyAttendanceChangeType";
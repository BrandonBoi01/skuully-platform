-- AlterTable
ALTER TABLE "DailyAttendance" ADD COLUMN     "lastManualEditedAt" TIMESTAMP(3),
ADD COLUMN     "lastManualEditedByUserId" TEXT,
ADD COLUMN     "lastUndeclaredAt" TIMESTAMP(3),
ADD COLUMN     "lastUndeclaredByUserId" TEXT,
ADD COLUMN     "manualEditCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "undeclaredCount" INTEGER NOT NULL DEFAULT 0;

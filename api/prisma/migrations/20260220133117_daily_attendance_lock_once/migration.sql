-- AlterTable
ALTER TABLE "DailyAttendance" ADD COLUMN     "declaredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastDeclaredAt" TIMESTAMP(3),
ADD COLUMN     "lastDeclaredByUserId" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedByRole" "SchoolRole",
ADD COLUMN     "lockedByUserId" TEXT,
ADD COLUMN     "lockedSource" "AttendanceSource";

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

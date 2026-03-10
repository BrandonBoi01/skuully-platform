-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHING', 'NON_TEACHING');

-- CreateEnum
CREATE TYPE "StaffEngagement" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'VISITING');

-- CreateEnum
CREATE TYPE "AttendanceMode" AS ENUM ('DAILY', 'SESSION');

-- CreateEnum
CREATE TYPE "AttendanceSessionType" AS ENUM ('CLASS_ROLLCALL', 'LESSON', 'STAFF_SESSION');

-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "sessionType" "AttendanceSessionType" NOT NULL DEFAULT 'CLASS_ROLLCALL';

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "programId" TEXT,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "staffNo" TEXT,
    "staffType" "StaffType" NOT NULL DEFAULT 'NON_TEACHING',
    "engagement" "StaffEngagement" NOT NULL DEFAULT 'FULL_TIME',
    "attendanceMode" "AttendanceMode" NOT NULL DEFAULT 'DAILY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSessionMark" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "markedById" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSessionMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Staff_schoolId_idx" ON "Staff"("schoolId");

-- CreateIndex
CREATE INDEX "Staff_programId_idx" ON "Staff"("programId");

-- CreateIndex
CREATE INDEX "Staff_userId_idx" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_status_idx" ON "Staff"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_schoolId_staffNo_key" ON "Staff"("schoolId", "staffNo");

-- CreateIndex
CREATE INDEX "StaffSessionMark_sessionId_idx" ON "StaffSessionMark"("sessionId");

-- CreateIndex
CREATE INDEX "StaffSessionMark_staffId_idx" ON "StaffSessionMark"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSessionMark_sessionId_staffId_key" ON "StaffSessionMark"("sessionId", "staffId");

-- CreateIndex
CREATE INDEX "AttendanceSession_sessionType_idx" ON "AttendanceSession"("sessionType");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SchoolProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSessionMark" ADD CONSTRAINT "StaffSessionMark_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSessionMark" ADD CONSTRAINT "StaffSessionMark_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSessionMark" ADD CONSTRAINT "StaffSessionMark_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

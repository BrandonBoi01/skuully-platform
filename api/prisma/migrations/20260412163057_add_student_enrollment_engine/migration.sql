-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('NEW_ADMISSION', 'PROMOTION', 'DEMOTION', 'TRANSFER_IN', 'TRANSFER_OUT', 'CLASS_CHANGE', 'PROGRAM_CHANGE', 'GRADUATION', 'WITHDRAWAL', 'RE_ENROLLMENT');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "StudentEnrollment" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "gradeId" TEXT,
    "classId" TEXT,
    "academicYear" TEXT,
    "termLabel" TEXT,
    "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'NEW_ADMISSION',
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "admittedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentEnrollment_institutionId_idx" ON "StudentEnrollment"("institutionId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_studentProfileId_idx" ON "StudentEnrollment"("studentProfileId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_programId_idx" ON "StudentEnrollment"("programId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_gradeId_idx" ON "StudentEnrollment"("gradeId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_classId_idx" ON "StudentEnrollment"("classId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_status_idx" ON "StudentEnrollment"("status");

-- CreateIndex
CREATE INDEX "StudentEnrollment_academicYear_idx" ON "StudentEnrollment"("academicYear");

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "ProgramGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

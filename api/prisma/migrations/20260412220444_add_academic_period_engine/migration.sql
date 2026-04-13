-- CreateEnum
CREATE TYPE "AcademicPeriodType" AS ENUM ('YEAR', 'TERM', 'SEMESTER', 'QUARTER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AcademicPeriodStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AcademicPeriod" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "parentPeriodId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "AcademicPeriodType" NOT NULL,
    "status" "AcademicPeriodStatus" NOT NULL DEFAULT 'PLANNED',
    "academicYearLabel" TEXT,
    "termNumber" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicPeriod_institutionId_idx" ON "AcademicPeriod"("institutionId");

-- CreateIndex
CREATE INDEX "AcademicPeriod_parentPeriodId_idx" ON "AcademicPeriod"("parentPeriodId");

-- CreateIndex
CREATE INDEX "AcademicPeriod_type_idx" ON "AcademicPeriod"("type");

-- CreateIndex
CREATE INDEX "AcademicPeriod_status_idx" ON "AcademicPeriod"("status");

-- CreateIndex
CREATE INDEX "AcademicPeriod_isCurrent_idx" ON "AcademicPeriod"("isCurrent");

-- CreateIndex
CREATE INDEX "AcademicPeriod_academicYearLabel_idx" ON "AcademicPeriod"("academicYearLabel");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicPeriod_institutionId_name_key" ON "AcademicPeriod"("institutionId", "name");

-- AddForeignKey
ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_parentPeriodId_fkey" FOREIGN KEY ("parentPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

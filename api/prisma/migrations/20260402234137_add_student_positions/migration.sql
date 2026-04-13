-- CreateEnum
CREATE TYPE "StudentPositionScope" AS ENUM ('INSTITUTION', 'PROGRAM', 'CLASS', 'DEPARTMENT', 'TRIBE', 'OTHER');

-- CreateEnum
CREATE TYPE "StudentPositionStatus" AS ENUM ('ACTIVE', 'ENDED', 'REVOKED');

-- CreateTable
CREATE TABLE "StudentPositionDefinition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "scope" "StudentPositionScope" NOT NULL DEFAULT 'INSTITUTION',
    "programId" TEXT,
    "classId" TEXT,
    "departmentId" TEXT,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "maxHolders" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPositionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPositionAssignment" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "positionDefinitionId" TEXT NOT NULL,
    "assignedByUserId" TEXT,
    "status" "StudentPositionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPositionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentPositionDefinition_institutionId_idx" ON "StudentPositionDefinition"("institutionId");

-- CreateIndex
CREATE INDEX "StudentPositionDefinition_programId_idx" ON "StudentPositionDefinition"("programId");

-- CreateIndex
CREATE INDEX "StudentPositionDefinition_classId_idx" ON "StudentPositionDefinition"("classId");

-- CreateIndex
CREATE INDEX "StudentPositionDefinition_departmentId_idx" ON "StudentPositionDefinition"("departmentId");

-- CreateIndex
CREATE INDEX "StudentPositionDefinition_scope_idx" ON "StudentPositionDefinition"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPositionDefinition_institutionId_key_key" ON "StudentPositionDefinition"("institutionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPositionDefinition_institutionId_name_key" ON "StudentPositionDefinition"("institutionId", "name");

-- CreateIndex
CREATE INDEX "StudentPositionAssignment_institutionId_idx" ON "StudentPositionAssignment"("institutionId");

-- CreateIndex
CREATE INDEX "StudentPositionAssignment_studentProfileId_idx" ON "StudentPositionAssignment"("studentProfileId");

-- CreateIndex
CREATE INDEX "StudentPositionAssignment_positionDefinitionId_idx" ON "StudentPositionAssignment"("positionDefinitionId");

-- CreateIndex
CREATE INDEX "StudentPositionAssignment_status_idx" ON "StudentPositionAssignment"("status");

-- AddForeignKey
ALTER TABLE "StudentPositionDefinition" ADD CONSTRAINT "StudentPositionDefinition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPositionDefinition" ADD CONSTRAINT "StudentPositionDefinition_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPositionDefinition" ADD CONSTRAINT "StudentPositionDefinition_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPositionDefinition" ADD CONSTRAINT "StudentPositionDefinition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPositionAssignment" ADD CONSTRAINT "StudentPositionAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPositionAssignment" ADD CONSTRAINT "StudentPositionAssignment_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPositionAssignment" ADD CONSTRAINT "StudentPositionAssignment_positionDefinitionId_fkey" FOREIGN KEY ("positionDefinitionId") REFERENCES "StudentPositionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPositionAssignment" ADD CONSTRAINT "StudentPositionAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

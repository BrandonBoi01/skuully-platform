-- CreateTable
CREATE TABLE "CurriculumTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumTemplateGrade" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stage" TEXT,

    CONSTRAINT "CurriculumTemplateGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumTemplateSubject" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CurriculumTemplateSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumTemplateGradeSubject" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "CurriculumTemplateGradeSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProgram" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramGrade" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "templateGradeId" TEXT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stage" TEXT,

    CONSTRAINT "ProgramGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramClass" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSubject" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "templateSubjectId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProgramSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramGradeSubject" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "ProgramGradeSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumTemplate_code_key" ON "CurriculumTemplate"("code");

-- CreateIndex
CREATE INDEX "CurriculumTemplateGrade_templateId_idx" ON "CurriculumTemplateGrade"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumTemplateGrade_templateId_order_key" ON "CurriculumTemplateGrade"("templateId", "order");

-- CreateIndex
CREATE INDEX "CurriculumTemplateSubject_templateId_idx" ON "CurriculumTemplateSubject"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumTemplateSubject_templateId_name_key" ON "CurriculumTemplateSubject"("templateId", "name");

-- CreateIndex
CREATE INDEX "CurriculumTemplateGradeSubject_gradeId_idx" ON "CurriculumTemplateGradeSubject"("gradeId");

-- CreateIndex
CREATE INDEX "CurriculumTemplateGradeSubject_subjectId_idx" ON "CurriculumTemplateGradeSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumTemplateGradeSubject_gradeId_subjectId_key" ON "CurriculumTemplateGradeSubject"("gradeId", "subjectId");

-- CreateIndex
CREATE INDEX "SchoolProgram_schoolId_idx" ON "SchoolProgram"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolProgram_templateId_idx" ON "SchoolProgram"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProgram_schoolId_name_key" ON "SchoolProgram"("schoolId", "name");

-- CreateIndex
CREATE INDEX "ProgramGrade_programId_idx" ON "ProgramGrade"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramGrade_programId_order_key" ON "ProgramGrade"("programId", "order");

-- CreateIndex
CREATE INDEX "ProgramClass_programId_idx" ON "ProgramClass"("programId");

-- CreateIndex
CREATE INDEX "ProgramClass_gradeId_idx" ON "ProgramClass"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramClass_programId_name_key" ON "ProgramClass"("programId", "name");

-- CreateIndex
CREATE INDEX "ProgramSubject_programId_idx" ON "ProgramSubject"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSubject_programId_name_key" ON "ProgramSubject"("programId", "name");

-- CreateIndex
CREATE INDEX "ProgramGradeSubject_gradeId_idx" ON "ProgramGradeSubject"("gradeId");

-- CreateIndex
CREATE INDEX "ProgramGradeSubject_subjectId_idx" ON "ProgramGradeSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramGradeSubject_gradeId_subjectId_key" ON "ProgramGradeSubject"("gradeId", "subjectId");

-- CreateIndex
CREATE INDEX "SchoolInvite_schoolId_idx" ON "SchoolInvite"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolInvite_email_idx" ON "SchoolInvite"("email");

-- CreateIndex
CREATE INDEX "SchoolMembership_schoolId_idx" ON "SchoolMembership"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolMembership_userId_idx" ON "SchoolMembership"("userId");

-- AddForeignKey
ALTER TABLE "CurriculumTemplateGrade" ADD CONSTRAINT "CurriculumTemplateGrade_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplateSubject" ADD CONSTRAINT "CurriculumTemplateSubject_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplateGradeSubject" ADD CONSTRAINT "CurriculumTemplateGradeSubject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "CurriculumTemplateGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplateGradeSubject" ADD CONSTRAINT "CurriculumTemplateGradeSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "CurriculumTemplateSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProgram" ADD CONSTRAINT "SchoolProgram_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProgram" ADD CONSTRAINT "SchoolProgram_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramGrade" ADD CONSTRAINT "ProgramGrade_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SchoolProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramClass" ADD CONSTRAINT "ProgramClass_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SchoolProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramClass" ADD CONSTRAINT "ProgramClass_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "ProgramGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSubject" ADD CONSTRAINT "ProgramSubject_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SchoolProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramGradeSubject" ADD CONSTRAINT "ProgramGradeSubject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "ProgramGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramGradeSubject" ADD CONSTRAINT "ProgramGradeSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ProgramSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

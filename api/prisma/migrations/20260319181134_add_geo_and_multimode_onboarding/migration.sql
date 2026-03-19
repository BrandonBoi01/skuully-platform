/*
  Warnings:

  - You are about to drop the column `learningMode` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `learningModeDraft` on the `UserOnboarding` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `SchoolMembership` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GenderAdmissionPolicy" AS ENUM ('BOYS_ONLY', 'GIRLS_ONLY', 'MIXED');

-- CreateEnum
CREATE TYPE "LearningMode" AS ENUM ('DAY', 'BOARDING', 'IN_PERSON', 'ONLINE', 'HYBRID');

-- DropForeignKey
ALTER TABLE "SchoolMembership" DROP CONSTRAINT "SchoolMembership_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolMembership" DROP CONSTRAINT "SchoolMembership_userId_fkey";

-- DropIndex
DROP INDEX "GeoCity_countryId_subdivisionId_name_key";

-- DropIndex
DROP INDEX "GeoSubdivision_countryId_code_key";

-- AlterTable
ALTER TABLE "School" DROP COLUMN "learningMode",
ADD COLUMN     "genderAdmissionPolicy" "GenderAdmissionPolicy",
ADD COLUMN     "learningModes" "LearningMode"[];

-- AlterTable
ALTER TABLE "SchoolMembership" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserOnboarding" DROP COLUMN "learningModeDraft",
ADD COLUMN     "genderAdmissionPolicyDraft" "GenderAdmissionPolicy",
ADD COLUMN     "learningModesDraft" "LearningMode"[];

-- CreateIndex
CREATE INDEX "GeoCity_countryId_subdivisionId_idx" ON "GeoCity"("countryId", "subdivisionId");

-- CreateIndex
CREATE INDEX "GeoCity_countryId_name_idx" ON "GeoCity"("countryId", "name");

-- CreateIndex
CREATE INDEX "GeoSubdivision_countryId_code_idx" ON "GeoSubdivision"("countryId", "code");

-- CreateIndex
CREATE INDEX "School_genderAdmissionPolicy_idx" ON "School"("genderAdmissionPolicy");

-- CreateIndex
CREATE INDEX "SchoolMembership_status_idx" ON "SchoolMembership"("status");

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

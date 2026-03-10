/*
  Warnings:

  - A unique constraint covering the columns `[userId,schoolId]` on the table `SchoolMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "SchoolMembership" DROP CONSTRAINT "SchoolMembership_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolMembership" DROP CONSTRAINT "SchoolMembership_userId_fkey";

-- DropIndex
DROP INDEX "SchoolMembership_schoolId_userId_key";

-- AlterTable
ALTER TABLE "SchoolMembership" ALTER COLUMN "role" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "SchoolMembership_userId_schoolId_key" ON "SchoolMembership"("userId", "schoolId");

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `roleKey` on the `SchoolInvite` table. All the data in the column will be lost.
  - The `status` column on the `SchoolInvite` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `SchoolMembership` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `SchoolProgram` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Staff` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[membershipId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'PENDING', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "SchoolInvite" DROP COLUMN "roleKey",
ADD COLUMN     "roleId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SchoolMembership" DROP COLUMN "status",
ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "SchoolProgram" DROP COLUMN "status",
ADD COLUMN     "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "status",
ADD COLUMN     "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "GuardianRelationshipType";

-- CreateIndex
CREATE INDEX "SchoolInvite_roleId_idx" ON "SchoolInvite"("roleId");

-- CreateIndex
CREATE INDEX "SchoolInvite_invitedByUserId_idx" ON "SchoolInvite"("invitedByUserId");

-- CreateIndex
CREATE INDEX "SchoolMembership_status_idx" ON "SchoolMembership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_membershipId_key" ON "Staff"("membershipId");

-- CreateIndex
CREATE INDEX "Staff_status_idx" ON "Staff"("status");

-- AddForeignKey
ALTER TABLE "SchoolInvite" ADD CONSTRAINT "SchoolInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SchoolRoleDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolInvite" ADD CONSTRAINT "SchoolInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

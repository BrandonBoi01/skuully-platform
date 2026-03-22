/*
  Warnings:

  - The values [JOIN_INSTITUTION,EXPLORE_SKUULLY] on the enum `OnboardingRoute` will be removed. If these variants are still used in the database, this will fail.
  - The `lockedByRole` column on the `DailyAttendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `changedByRole` column on the `DailyAttendanceChange` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `SchoolInvite` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `SchoolMembership` table. All the data in the column will be lost.
  - You are about to drop the column `exploreHeadlineDraft` on the `UserOnboarding` table. All the data in the column will be lost.
  - You are about to drop the column `institutionIntent` on the `UserOnboarding` table. All the data in the column will be lost.
  - You are about to drop the column `joinInviteCodeDraft` on the `UserOnboarding` table. All the data in the column will be lost.
  - You are about to drop the column `joinRoleDraft` on the `UserOnboarding` table. All the data in the column will be lost.
  - You are about to drop the column `joinSchoolIdDraft` on the `UserOnboarding` table. All the data in the column will be lost.
  - Added the required column `membershipType` to the `SchoolInvite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membershipType` to the `SchoolMembership` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GuardianRelationshipType" AS ENUM ('PARENT', 'GUARDIAN', 'CAREGIVER', 'NEXT_OF_KIN', 'PICKUP_PERSON', 'SPONSOR');

-- CreateEnum
CREATE TYPE "AccountIntent" AS ENUM ('FOUNDER', 'STAFF', 'PARENT', 'STUDENT', 'PROFESSIONAL', 'EXPLORER', 'UNSURE');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'STUDENT', 'PARENT', 'GUARDIAN', 'CAREGIVER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PRIVATE', 'SCHOOL_ONLY', 'CONNECTIONS_ONLY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'RESTRICTED', 'SUSPENDED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('LOW', 'NORMAL', 'VERIFIED', 'HIGH');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PARENT', 'GUARDIAN', 'CAREGIVER', 'NEXT_OF_KIN', 'EMERGENCY_CONTACT');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SchoolJoinRequestType" AS ENUM ('STUDENT', 'PARENT', 'STAFF');

-- CreateEnum
CREATE TYPE "SchoolJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "OnboardingRoute_new" AS ENUM ('BUILD_INSTITUTION', 'PERSONAL_ACCOUNT');
ALTER TABLE "UserOnboarding" ALTER COLUMN "route" TYPE "OnboardingRoute_new" USING ("route"::text::"OnboardingRoute_new");
ALTER TYPE "OnboardingRoute" RENAME TO "OnboardingRoute_old";
ALTER TYPE "OnboardingRoute_new" RENAME TO "OnboardingRoute";
DROP TYPE "public"."OnboardingRoute_old";
COMMIT;

-- DropIndex
DROP INDEX "UserOnboarding_joinSchoolIdDraft_idx";

-- AlterTable
ALTER TABLE "DailyAttendance" DROP COLUMN "lockedByRole",
ADD COLUMN     "lockedByRole" "MembershipType";

-- AlterTable
ALTER TABLE "DailyAttendanceChange" DROP COLUMN "changedByRole",
ADD COLUMN     "changedByRole" "MembershipType";

-- AlterTable
ALTER TABLE "SchoolInvite" DROP COLUMN "role",
ADD COLUMN     "invitedByUserId" TEXT,
ADD COLUMN     "membershipType" "MembershipType" NOT NULL,
ADD COLUMN     "roleKey" TEXT;

-- AlterTable
ALTER TABLE "SchoolMembership" DROP COLUMN "role",
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "membershipType" "MembershipType" NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "membershipId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "isMinor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "trustLevel" "TrustLevel" NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "UserOnboarding" DROP COLUMN "exploreHeadlineDraft",
DROP COLUMN "institutionIntent",
DROP COLUMN "joinInviteCodeDraft",
DROP COLUMN "joinRoleDraft",
DROP COLUMN "joinSchoolIdDraft",
ADD COLUMN     "accountIntent" "AccountIntent",
ADD COLUMN     "dateOfBirthDraft" TIMESTAMP(3),
ADD COLUMN     "personalHeadlineDraft" TEXT;

-- DropEnum
DROP TYPE "InstitutionIntent";

-- DropEnum
DROP TYPE "SchoolRole";

-- CreateTable
CREATE TABLE "SchoolRoleDefinition" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isAssignable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolRoleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolRolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolMembershipAssignedRole" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolMembershipAssignedRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolJoinRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SchoolJoinRequestType" NOT NULL,
    "status" "SchoolJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "studentFullName" TEXT,
    "admissionNo" TEXT,
    "staffNo" TEXT,
    "note" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardian" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianUserId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "relationshipType" "RelationshipType" NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canPickUp" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveUpdates" BOOLEAN NOT NULL DEFAULT true,
    "canPayFees" BOOLEAN NOT NULL DEFAULT false,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolRoleDefinition_schoolId_idx" ON "SchoolRoleDefinition"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRoleDefinition_schoolId_key_key" ON "SchoolRoleDefinition"("schoolId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRoleDefinition_schoolId_name_key" ON "SchoolRoleDefinition"("schoolId", "name");

-- CreateIndex
CREATE INDEX "SchoolRolePermission_roleId_idx" ON "SchoolRolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRolePermission_roleId_permission_key" ON "SchoolRolePermission"("roleId", "permission");

-- CreateIndex
CREATE INDEX "SchoolMembershipAssignedRole_membershipId_idx" ON "SchoolMembershipAssignedRole"("membershipId");

-- CreateIndex
CREATE INDEX "SchoolMembershipAssignedRole_roleId_idx" ON "SchoolMembershipAssignedRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolMembershipAssignedRole_membershipId_roleId_key" ON "SchoolMembershipAssignedRole"("membershipId", "roleId");

-- CreateIndex
CREATE INDEX "SchoolJoinRequest_schoolId_idx" ON "SchoolJoinRequest"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolJoinRequest_userId_idx" ON "SchoolJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "SchoolJoinRequest_type_idx" ON "SchoolJoinRequest"("type");

-- CreateIndex
CREATE INDEX "SchoolJoinRequest_status_idx" ON "SchoolJoinRequest"("status");

-- CreateIndex
CREATE INDEX "StudentGuardian_schoolId_idx" ON "StudentGuardian"("schoolId");

-- CreateIndex
CREATE INDEX "StudentGuardian_studentId_idx" ON "StudentGuardian"("studentId");

-- CreateIndex
CREATE INDEX "StudentGuardian_guardianUserId_idx" ON "StudentGuardian"("guardianUserId");

-- CreateIndex
CREATE INDEX "StudentGuardian_status_idx" ON "StudentGuardian"("status");

-- CreateIndex
CREATE INDEX "SchoolInvite_membershipType_idx" ON "SchoolInvite"("membershipType");

-- CreateIndex
CREATE INDEX "SchoolMembership_membershipType_idx" ON "SchoolMembership"("membershipType");

-- CreateIndex
CREATE INDEX "Student_userId_idx" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "User_dateOfBirth_idx" ON "User"("dateOfBirth");

-- CreateIndex
CREATE INDEX "User_isMinor_idx" ON "User"("isMinor");

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE INDEX "UserOnboarding_accountIntent_idx" ON "UserOnboarding"("accountIntent");

-- AddForeignKey
ALTER TABLE "SchoolRoleDefinition" ADD CONSTRAINT "SchoolRoleDefinition_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRolePermission" ADD CONSTRAINT "SchoolRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SchoolRoleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembershipAssignedRole" ADD CONSTRAINT "SchoolMembershipAssignedRole_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SchoolMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembershipAssignedRole" ADD CONSTRAINT "SchoolMembershipAssignedRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SchoolRoleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolJoinRequest" ADD CONSTRAINT "SchoolJoinRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolJoinRequest" ADD CONSTRAINT "SchoolJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolJoinRequest" ADD CONSTRAINT "SchoolJoinRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SchoolMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

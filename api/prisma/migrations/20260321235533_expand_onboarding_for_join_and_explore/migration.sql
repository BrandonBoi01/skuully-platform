-- AlterTable
ALTER TABLE "User" ADD COLUMN     "headline" TEXT;

-- AlterTable
ALTER TABLE "UserOnboarding" ADD COLUMN     "exploreHeadlineDraft" TEXT,
ADD COLUMN     "joinInviteCodeDraft" TEXT,
ADD COLUMN     "joinRoleDraft" TEXT,
ADD COLUMN     "joinSchoolIdDraft" TEXT;

-- CreateIndex
CREATE INDEX "UserOnboarding_joinSchoolIdDraft_idx" ON "UserOnboarding"("joinSchoolIdDraft");

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('EMAIL', 'PHONE', 'SKUULLY_ID', 'GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('EMAIL_VERIFY', 'PHONE_VERIFY', 'LOGIN_2FA', 'PASSWORD_RESET', 'PHONE_CHANGE');

-- CreateEnum
CREATE TYPE "OnboardingRoute" AS ENUM ('BUILD_INSTITUTION', 'PERSONAL_ACCOUNT');

-- CreateEnum
CREATE TYPE "AccountIntent" AS ENUM ('FOUNDER', 'STAFF', 'PARENT', 'STUDENT', 'PROFESSIONAL', 'EXPLORER', 'UNSURE');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PRIVATE', 'INSTITUTION_ONLY', 'CONNECTIONS_ONLY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'RESTRICTED', 'SUSPENDED', 'PENDING_REVIEW', 'DELETED');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('LOW', 'NORMAL', 'VERIFIED', 'HIGH');

-- CreateEnum
CREATE TYPE "Pronoun" AS ENUM ('HE_HIM', 'SHE_HER', 'THEY_THEM', 'PREFER_NOT_TO_SAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'POLYTECHNIC', 'VOCATIONAL', 'TRAINING_CENTER', 'ACADEMY', 'GOVERNMENT_BODY', 'NGO', 'CHILDREN_HOME', 'EXAM_BODY', 'SPORTS_BODY', 'DRAMA_BODY', 'LOAN_BODY', 'OTHER');

-- CreateEnum
CREATE TYPE "InstitutionCategory" AS ENUM ('SCHOOL', 'GOVERNMENT', 'NGO', 'PARTNER', 'COMPETITION_BODY', 'SUPPORT_BODY', 'COMMUNITY', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'STUDENT', 'PARENT', 'GUARDIAN', 'CAREGIVER', 'PARTNER', 'OFFICIAL', 'ALUMNI', 'VIEWER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('ADMINISTRATION', 'HR', 'FINANCE', 'TRANSPORT', 'KITCHEN', 'HEALTH', 'ACADEMICS', 'DISCIPLINE', 'COMMUNICATIONS', 'MARKETING', 'IT', 'LIBRARY', 'SPORTS', 'EVENTS', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('INSTITUTION', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "GenderAdmissionPolicy" AS ENUM ('BOYS_ONLY', 'GIRLS_ONLY', 'MIXED');

-- CreateEnum
CREATE TYPE "LearningMode" AS ENUM ('DAY', 'BOARDING', 'IN_PERSON', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'PENDING', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHING', 'NON_TEACHING');

-- CreateEnum
CREATE TYPE "StaffEngagement" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING', 'INTERN');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PARENT', 'GUARDIAN', 'CAREGIVER', 'NEXT_OF_KIN', 'EMERGENCY_CONTACT');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('PRIVATE', 'CONNECTIONS', 'TRIBE', 'INSTITUTION', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "TribePrivacy" AS ENUM ('PUBLIC', 'PRIVATE', 'SECRET');

-- CreateEnum
CREATE TYPE "TribeMemberRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "VerificationTargetType" AS ENUM ('USER', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "BillingModel" AS ENUM ('FLAT', 'PER_STUDENT', 'PER_ACTIVE_STUDENT', 'PER_TERM', 'PER_YEAR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "HopeBeneficiaryStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CompetitionLevel" AS ENUM ('INTERNAL', 'SUB_COUNTY', 'COUNTY', 'REGIONAL', 'NATIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('DRAFT', 'OPEN', 'LIVE', 'CLOSED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('CERTIFICATE', 'BADGE', 'TROPHY', 'RESULT_SLIP', 'TRANSCRIPT');

-- CreateEnum
CREATE TYPE "InstitutionJoinRequestType" AS ENUM ('STUDENT', 'STAFF', 'PARENT', 'GUARDIAN', 'PARTNER');

-- CreateEnum
CREATE TYPE "InstitutionJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "skuullyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "coverImageUrl" TEXT,
    "bio" TEXT,
    "headline" TEXT,
    "pronoun" "Pronoun",
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "nationalityCode" TEXT,
    "residenceCountryCode" TEXT,
    "residenceSubdivisionId" TEXT,
    "residenceCityId" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "timezone" TEXT,
    "languageCode" TEXT,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "trustLevel" "TrustLevel" NOT NULL DEFAULT 'LOW',
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "onboardingCompletedAt" TIMESTAMP(3),
    "preferredLoginMethod" "LoginMethod",
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthProviderAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthProviderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL DEFAULT 'EMAIL_VERIFY',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL DEFAULT 'PHONE_VERIFY',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "event" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoCountry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "iso3" TEXT,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "flagEmoji" TEXT,
    "region" TEXT,
    "subregion" TEXT,
    "capital" TEXT,
    "currencyCode" TEXT,
    "currencyName" TEXT,
    "phoneCode" TEXT,
    "phoneMinLength" INTEGER,
    "phoneMaxLength" INTEGER,
    "nativeCurriculumName" TEXT,
    "nativeCurriculumCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoSubdivision" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoSubdivision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoCity" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "subdivisionId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoTimezone" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utcOffset" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoTimezone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOnboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "route" "OnboardingRoute",
    "accountIntent" "AccountIntent",
    "institutionTypeDraft" "InstitutionType",
    "institutionNameDraft" TEXT,
    "nationalityCodeDraft" TEXT,
    "residenceCountryCodeDraft" TEXT,
    "residenceSubdivisionIdDraft" TEXT,
    "residenceCityIdDraft" TEXT,
    "addressLine1Draft" TEXT,
    "addressLine2Draft" TEXT,
    "pronounDraft" "Pronoun",
    "dateOfBirthDraft" TIMESTAMP(3),
    "skuullyIdDraft" TEXT,
    "headlineDraft" TEXT,
    "avatarUrlDraft" TEXT,
    "academicLabelDraft" TEXT,
    "academicItemsDraft" TEXT[],
    "academicSetLater" BOOLEAN NOT NULL DEFAULT false,
    "learningModesDraft" "LearningMode"[],
    "ownershipDraft" TEXT,
    "levelTypeDraft" TEXT,
    "genderAdmissionPolicyDraft" "GenderAdmissionPolicy",
    "phoneCountryCodeDraft" TEXT,
    "phoneDialCodeDraft" TEXT,
    "phoneNationalDraft" TEXT,
    "phoneE164Draft" TEXT,
    "phoneSetLater" BOOLEAN NOT NULL DEFAULT true,
    "currentStep" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "institutionType" "InstitutionType" NOT NULL,
    "institutionCategory" "InstitutionCategory" NOT NULL DEFAULT 'SCHOOL',
    "description" TEXT,
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "primaryPhone" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "foundedYear" INTEGER,
    "countryCode" TEXT,
    "subdivisionId" TEXT,
    "cityId" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "timezone" TEXT,
    "ownership" TEXT,
    "levelType" TEXT,
    "genderAdmissionPolicy" "GenderAdmissionPolicy",
    "learningModes" "LearningMode"[],
    "curriculumSummary" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationSubmittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipType" "MembershipType" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipInvite" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "membershipType" "MembershipType" NOT NULL,
    "invitedByUserId" TEXT,
    "code" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DepartmentType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentMembership" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRole" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "departmentId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL DEFAULT 'INSTITUTION',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isAssignable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipAssignedRole" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipAssignedRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionJoinRequest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "InstitutionJoinRequestType" NOT NULL,
    "status" "InstitutionJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "referenceNumber" TEXT,
    "admissionNo" TEXT,
    "staffNo" TEXT,
    "note" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionAcademicFramework" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionAcademicFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
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
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "ClassRoom" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "gradeId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateStudentField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRING',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "uniqueScope" TEXT,
    "optionsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateStudentField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "programId" TEXT,
    "classId" TEXT,
    "userId" TEXT,
    "admissionNo" TEXT,
    "fullName" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationalityCode" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardianLink" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "studentUserId" TEXT,
    "guardianUserId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "relationshipType" "RelationshipType" NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveUpdates" BOOLEAN NOT NULL DEFAULT true,
    "canPayFees" BOOLEAN NOT NULL DEFAULT false,
    "canPickUp" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFieldValue" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "membershipId" TEXT,
    "userId" TEXT,
    "departmentId" TEXT,
    "programId" TEXT,
    "staffNo" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "staffType" "StaffType" NOT NULL DEFAULT 'NON_TEACHING',
    "engagement" "StaffEngagement" NOT NULL DEFAULT 'FULL_TIME',
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "institutionId" TEXT,
    "displayName" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "about" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorInstitutionId" TEXT,
    "socialProfileId" TEXT,
    "content" TEXT NOT NULL,
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MomentComment" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MomentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MomentStar" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentStar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tribe" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "privacy" "TribePrivacy" NOT NULL DEFAULT 'PUBLIC',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tribe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TribeMember" (
    "id" TEXT NOT NULL,
    "tribeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TribeMemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TribeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TribeMoment" (
    "id" TEXT NOT NULL,
    "tribeId" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TribeMoment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerUserId" TEXT NOT NULL,
    "followedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "institutionId" TEXT,
    "type" "VerificationTargetType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "billingModel" "BillingModel" NOT NULL,
    "institutionType" "InstitutionType",
    "basePrice" DECIMAL(18,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyCode" TEXT NOT NULL,
    "subtotalAmount" DECIMAL(18,2) NOT NULL,
    "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HopeBeneficiary" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "countryCode" TEXT,
    "story" TEXT,
    "status" "HopeBeneficiaryStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HopeBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HopeApplication" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "applicantUserId" TEXT,
    "reviewedByUserId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HopeApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HopeDonation" (
    "id" TEXT NOT NULL,
    "donorUserId" TEXT,
    "donorName" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "HopeDonation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HopeDonationAllocation" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "institutionId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HopeDonationAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionEvent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" "CompetitionLevel" NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionEntry" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentProfileId" TEXT,
    "participantName" TEXT NOT NULL,
    "score" DECIMAL(18,2),
    "rank" INTEGER,
    "qualifiedNextStage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "issuedByUserId" TEXT,
    "recipientUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "credentialType" "CredentialType" NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeAward" (
    "id" TEXT NOT NULL,
    "badgeDefinitionId" TEXT NOT NULL,
    "awardedToUserId" TEXT NOT NULL,
    "awardedByUserId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "BadgeAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_skuullyId_key" ON "User"("skuullyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_fullName_idx" ON "User"("fullName");

-- CreateIndex
CREATE INDEX "User_firstName_idx" ON "User"("firstName");

-- CreateIndex
CREATE INDEX "User_lastName_idx" ON "User"("lastName");

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE INDEX "User_trustLevel_idx" ON "User"("trustLevel");

-- CreateIndex
CREATE INDEX "User_nationalityCode_idx" ON "User"("nationalityCode");

-- CreateIndex
CREATE INDEX "User_residenceCountryCode_idx" ON "User"("residenceCountryCode");

-- CreateIndex
CREATE INDEX "AuthProviderAccount_userId_idx" ON "AuthProviderAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProviderAccount_provider_providerUserId_key" ON "AuthProviderAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProviderAccount_userId_provider_key" ON "AuthProviderAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "EmailVerificationCode_userId_idx" ON "EmailVerificationCode"("userId");

-- CreateIndex
CREATE INDEX "EmailVerificationCode_email_idx" ON "EmailVerificationCode"("email");

-- CreateIndex
CREATE INDEX "EmailVerificationCode_purpose_idx" ON "EmailVerificationCode"("purpose");

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_userId_idx" ON "PhoneVerificationCode"("userId");

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_phone_idx" ON "PhoneVerificationCode"("phone");

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_purpose_idx" ON "PhoneVerificationCode"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");

-- CreateIndex
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthAuditLog_userId_idx" ON "AuthAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuthAuditLog_event_idx" ON "AuthAuditLog"("event");

-- CreateIndex
CREATE INDEX "AuthAuditLog_createdAt_idx" ON "AuthAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeoCountry_code_key" ON "GeoCountry"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GeoCountry_iso3_key" ON "GeoCountry"("iso3");

-- CreateIndex
CREATE INDEX "GeoCountry_name_idx" ON "GeoCountry"("name");

-- CreateIndex
CREATE INDEX "GeoCountry_isActive_idx" ON "GeoCountry"("isActive");

-- CreateIndex
CREATE INDEX "GeoSubdivision_countryId_idx" ON "GeoSubdivision"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "GeoSubdivision_countryId_name_key" ON "GeoSubdivision"("countryId", "name");

-- CreateIndex
CREATE INDEX "GeoCity_countryId_idx" ON "GeoCity"("countryId");

-- CreateIndex
CREATE INDEX "GeoCity_subdivisionId_idx" ON "GeoCity"("subdivisionId");

-- CreateIndex
CREATE INDEX "GeoCity_name_idx" ON "GeoCity"("name");

-- CreateIndex
CREATE INDEX "GeoTimezone_countryId_idx" ON "GeoTimezone"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "GeoTimezone_countryId_name_key" ON "GeoTimezone"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboarding_userId_key" ON "UserOnboarding"("userId");

-- CreateIndex
CREATE INDEX "UserOnboarding_route_idx" ON "UserOnboarding"("route");

-- CreateIndex
CREATE INDEX "UserOnboarding_accountIntent_idx" ON "UserOnboarding"("accountIntent");

-- CreateIndex
CREATE INDEX "UserOnboarding_institutionTypeDraft_idx" ON "UserOnboarding"("institutionTypeDraft");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

-- CreateIndex
CREATE INDEX "Institution_institutionType_idx" ON "Institution"("institutionType");

-- CreateIndex
CREATE INDEX "Institution_institutionCategory_idx" ON "Institution"("institutionCategory");

-- CreateIndex
CREATE INDEX "Institution_countryCode_idx" ON "Institution"("countryCode");

-- CreateIndex
CREATE INDEX "Institution_verificationStatus_idx" ON "Institution"("verificationStatus");

-- CreateIndex
CREATE INDEX "Institution_name_idx" ON "Institution"("name");

-- CreateIndex
CREATE INDEX "Membership_institutionId_idx" ON "Membership"("institutionId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_membershipType_idx" ON "Membership"("membershipType");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_institutionId_userId_key" ON "Membership"("institutionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipInvite_code_key" ON "MembershipInvite"("code");

-- CreateIndex
CREATE INDEX "MembershipInvite_institutionId_idx" ON "MembershipInvite"("institutionId");

-- CreateIndex
CREATE INDEX "MembershipInvite_email_idx" ON "MembershipInvite"("email");

-- CreateIndex
CREATE INDEX "MembershipInvite_status_idx" ON "MembershipInvite"("status");

-- CreateIndex
CREATE INDEX "Department_institutionId_idx" ON "Department"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_institutionId_name_key" ON "Department"("institutionId", "name");

-- CreateIndex
CREATE INDEX "DepartmentMembership_departmentId_idx" ON "DepartmentMembership"("departmentId");

-- CreateIndex
CREATE INDEX "DepartmentMembership_membershipId_idx" ON "DepartmentMembership"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentMembership_departmentId_membershipId_key" ON "DepartmentMembership"("departmentId", "membershipId");

-- CreateIndex
CREATE INDEX "AccessRole_institutionId_idx" ON "AccessRole"("institutionId");

-- CreateIndex
CREATE INDEX "AccessRole_departmentId_idx" ON "AccessRole"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRole_institutionId_key_key" ON "AccessRole"("institutionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRole_institutionId_name_key" ON "AccessRole"("institutionId", "name");

-- CreateIndex
CREATE INDEX "AccessRolePermission_roleId_idx" ON "AccessRolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRolePermission_roleId_permission_key" ON "AccessRolePermission"("roleId", "permission");

-- CreateIndex
CREATE INDEX "MembershipAssignedRole_membershipId_idx" ON "MembershipAssignedRole"("membershipId");

-- CreateIndex
CREATE INDEX "MembershipAssignedRole_roleId_idx" ON "MembershipAssignedRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipAssignedRole_membershipId_roleId_key" ON "MembershipAssignedRole"("membershipId", "roleId");

-- CreateIndex
CREATE INDEX "InstitutionJoinRequest_institutionId_idx" ON "InstitutionJoinRequest"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionJoinRequest_userId_idx" ON "InstitutionJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "InstitutionJoinRequest_requestType_idx" ON "InstitutionJoinRequest"("requestType");

-- CreateIndex
CREATE INDEX "InstitutionJoinRequest_status_idx" ON "InstitutionJoinRequest"("status");

-- CreateIndex
CREATE INDEX "InstitutionAcademicFramework_institutionId_idx" ON "InstitutionAcademicFramework"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionAcademicFramework_institutionId_label_key" ON "InstitutionAcademicFramework"("institutionId", "label");

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
CREATE INDEX "Program_institutionId_idx" ON "Program"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Program_institutionId_name_key" ON "Program"("institutionId", "name");

-- CreateIndex
CREATE INDEX "ProgramGrade_programId_idx" ON "ProgramGrade"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramGrade_programId_order_key" ON "ProgramGrade"("programId", "order");

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
CREATE INDEX "ClassRoom_institutionId_idx" ON "ClassRoom"("institutionId");

-- CreateIndex
CREATE INDEX "ClassRoom_programId_idx" ON "ClassRoom"("programId");

-- CreateIndex
CREATE INDEX "ClassRoom_gradeId_idx" ON "ClassRoom"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRoom_institutionId_name_key" ON "ClassRoom"("institutionId", "name");

-- CreateIndex
CREATE INDEX "TemplateStudentField_templateId_idx" ON "TemplateStudentField"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateStudentField_templateId_key_key" ON "TemplateStudentField"("templateId", "key");

-- CreateIndex
CREATE INDEX "StudentProfile_institutionId_idx" ON "StudentProfile"("institutionId");

-- CreateIndex
CREATE INDEX "StudentProfile_programId_idx" ON "StudentProfile"("programId");

-- CreateIndex
CREATE INDEX "StudentProfile_classId_idx" ON "StudentProfile"("classId");

-- CreateIndex
CREATE INDEX "StudentProfile_userId_idx" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_institutionId_admissionNo_key" ON "StudentProfile"("institutionId", "admissionNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_institutionId_userId_key" ON "StudentProfile"("institutionId", "userId");

-- CreateIndex
CREATE INDEX "StudentGuardianLink_institutionId_idx" ON "StudentGuardianLink"("institutionId");

-- CreateIndex
CREATE INDEX "StudentGuardianLink_studentProfileId_idx" ON "StudentGuardianLink"("studentProfileId");

-- CreateIndex
CREATE INDEX "StudentGuardianLink_guardianUserId_idx" ON "StudentGuardianLink"("guardianUserId");

-- CreateIndex
CREATE INDEX "StudentFieldValue_studentProfileId_idx" ON "StudentFieldValue"("studentProfileId");

-- CreateIndex
CREATE INDEX "StudentFieldValue_fieldId_idx" ON "StudentFieldValue"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFieldValue_studentProfileId_fieldId_key" ON "StudentFieldValue"("studentProfileId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_membershipId_key" ON "StaffProfile"("membershipId");

-- CreateIndex
CREATE INDEX "StaffProfile_institutionId_idx" ON "StaffProfile"("institutionId");

-- CreateIndex
CREATE INDEX "StaffProfile_departmentId_idx" ON "StaffProfile"("departmentId");

-- CreateIndex
CREATE INDEX "StaffProfile_programId_idx" ON "StaffProfile"("programId");

-- CreateIndex
CREATE INDEX "StaffProfile_userId_idx" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_institutionId_staffNo_key" ON "StaffProfile"("institutionId", "staffNo");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_institutionId_userId_key" ON "StaffProfile"("institutionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_userId_key" ON "SocialProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_institutionId_key" ON "SocialProfile"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_handle_key" ON "SocialProfile"("handle");

-- CreateIndex
CREATE INDEX "Moment_authorUserId_idx" ON "Moment"("authorUserId");

-- CreateIndex
CREATE INDEX "Moment_authorInstitutionId_idx" ON "Moment"("authorInstitutionId");

-- CreateIndex
CREATE INDEX "Moment_publishedAt_idx" ON "Moment"("publishedAt");

-- CreateIndex
CREATE INDEX "MomentComment_momentId_idx" ON "MomentComment"("momentId");

-- CreateIndex
CREATE INDEX "MomentComment_authorUserId_idx" ON "MomentComment"("authorUserId");

-- CreateIndex
CREATE INDEX "MomentStar_momentId_idx" ON "MomentStar"("momentId");

-- CreateIndex
CREATE INDEX "MomentStar_userId_idx" ON "MomentStar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MomentStar_momentId_userId_key" ON "MomentStar"("momentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tribe_slug_key" ON "Tribe"("slug");

-- CreateIndex
CREATE INDEX "Tribe_institutionId_idx" ON "Tribe"("institutionId");

-- CreateIndex
CREATE INDEX "Tribe_createdByUserId_idx" ON "Tribe"("createdByUserId");

-- CreateIndex
CREATE INDEX "TribeMember_tribeId_idx" ON "TribeMember"("tribeId");

-- CreateIndex
CREATE INDEX "TribeMember_userId_idx" ON "TribeMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TribeMember_tribeId_userId_key" ON "TribeMember"("tribeId", "userId");

-- CreateIndex
CREATE INDEX "TribeMoment_tribeId_idx" ON "TribeMoment"("tribeId");

-- CreateIndex
CREATE INDEX "TribeMoment_momentId_idx" ON "TribeMoment"("momentId");

-- CreateIndex
CREATE UNIQUE INDEX "TribeMoment_tribeId_momentId_key" ON "TribeMoment"("tribeId", "momentId");

-- CreateIndex
CREATE INDEX "DirectMessage_senderUserId_idx" ON "DirectMessage"("senderUserId");

-- CreateIndex
CREATE INDEX "DirectMessage_receiverUserId_idx" ON "DirectMessage"("receiverUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "UserFollow_followerUserId_idx" ON "UserFollow"("followerUserId");

-- CreateIndex
CREATE INDEX "UserFollow_followedUserId_idx" ON "UserFollow"("followedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerUserId_followedUserId_key" ON "UserFollow"("followerUserId", "followedUserId");

-- CreateIndex
CREATE INDEX "InstitutionFollow_userId_idx" ON "InstitutionFollow"("userId");

-- CreateIndex
CREATE INDEX "InstitutionFollow_institutionId_idx" ON "InstitutionFollow"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionFollow_userId_institutionId_key" ON "InstitutionFollow"("userId", "institutionId");

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_idx" ON "VerificationRequest"("userId");

-- CreateIndex
CREATE INDEX "VerificationRequest_institutionId_idx" ON "VerificationRequest"("institutionId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationDocument_verificationRequestId_idx" ON "VerificationDocument"("verificationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_institutionId_key" ON "Subscription"("institutionId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoice_invoiceNumber_key" ON "BillingInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "BillingInvoice_institutionId_idx" ON "BillingInvoice"("institutionId");

-- CreateIndex
CREATE INDEX "BillingInvoice_subscriptionId_idx" ON "BillingInvoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "BillingInvoice_status_idx" ON "BillingInvoice"("status");

-- CreateIndex
CREATE INDEX "HopeBeneficiary_institutionId_idx" ON "HopeBeneficiary"("institutionId");

-- CreateIndex
CREATE INDEX "HopeBeneficiary_status_idx" ON "HopeBeneficiary"("status");

-- CreateIndex
CREATE INDEX "HopeApplication_beneficiaryId_idx" ON "HopeApplication"("beneficiaryId");

-- CreateIndex
CREATE INDEX "HopeApplication_status_idx" ON "HopeApplication"("status");

-- CreateIndex
CREATE INDEX "HopeDonation_donorUserId_idx" ON "HopeDonation"("donorUserId");

-- CreateIndex
CREATE INDEX "HopeDonation_status_idx" ON "HopeDonation"("status");

-- CreateIndex
CREATE INDEX "HopeDonationAllocation_donationId_idx" ON "HopeDonationAllocation"("donationId");

-- CreateIndex
CREATE INDEX "HopeDonationAllocation_beneficiaryId_idx" ON "HopeDonationAllocation"("beneficiaryId");

-- CreateIndex
CREATE INDEX "HopeDonationAllocation_institutionId_idx" ON "HopeDonationAllocation"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionEvent_institutionId_idx" ON "InstitutionEvent"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionEvent_startsAt_idx" ON "InstitutionEvent"("startsAt");

-- CreateIndex
CREATE INDEX "Competition_institutionId_idx" ON "Competition"("institutionId");

-- CreateIndex
CREATE INDEX "Competition_status_idx" ON "Competition"("status");

-- CreateIndex
CREATE INDEX "CompetitionEntry_competitionId_idx" ON "CompetitionEntry"("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionEntry_institutionId_idx" ON "CompetitionEntry"("institutionId");

-- CreateIndex
CREATE INDEX "CompetitionEntry_studentProfileId_idx" ON "CompetitionEntry"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_verificationCode_key" ON "Credential"("verificationCode");

-- CreateIndex
CREATE INDEX "Credential_institutionId_idx" ON "Credential"("institutionId");

-- CreateIndex
CREATE INDEX "Credential_recipientUserId_idx" ON "Credential"("recipientUserId");

-- CreateIndex
CREATE INDEX "BadgeDefinition_institutionId_idx" ON "BadgeDefinition"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_institutionId_code_key" ON "BadgeDefinition"("institutionId", "code");

-- CreateIndex
CREATE INDEX "BadgeAward_badgeDefinitionId_idx" ON "BadgeAward"("badgeDefinitionId");

-- CreateIndex
CREATE INDEX "BadgeAward_awardedToUserId_idx" ON "BadgeAward"("awardedToUserId");

-- CreateIndex
CREATE INDEX "Announcement_institutionId_idx" ON "Announcement"("institutionId");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_nationalityCode_fkey" FOREIGN KEY ("nationalityCode") REFERENCES "GeoCountry"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residenceCountryCode_fkey" FOREIGN KEY ("residenceCountryCode") REFERENCES "GeoCountry"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residenceSubdivisionId_fkey" FOREIGN KEY ("residenceSubdivisionId") REFERENCES "GeoSubdivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residenceCityId_fkey" FOREIGN KEY ("residenceCityId") REFERENCES "GeoCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthProviderAccount" ADD CONSTRAINT "AuthProviderAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationCode" ADD CONSTRAINT "EmailVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneVerificationCode" ADD CONSTRAINT "PhoneVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoSubdivision" ADD CONSTRAINT "GeoSubdivision_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "GeoCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoCity" ADD CONSTRAINT "GeoCity_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "GeoCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoCity" ADD CONSTRAINT "GeoCity_subdivisionId_fkey" FOREIGN KEY ("subdivisionId") REFERENCES "GeoSubdivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoTimezone" ADD CONSTRAINT "GeoTimezone_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "GeoCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboarding" ADD CONSTRAINT "UserOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "GeoCountry"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_subdivisionId_fkey" FOREIGN KEY ("subdivisionId") REFERENCES "GeoSubdivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "GeoCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipInvite" ADD CONSTRAINT "MembershipInvite_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipInvite" ADD CONSTRAINT "MembershipInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentMembership" ADD CONSTRAINT "DepartmentMembership_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentMembership" ADD CONSTRAINT "DepartmentMembership_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRole" ADD CONSTRAINT "AccessRole_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRole" ADD CONSTRAINT "AccessRole_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRolePermission" ADD CONSTRAINT "AccessRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipAssignedRole" ADD CONSTRAINT "MembershipAssignedRole_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipAssignedRole" ADD CONSTRAINT "MembershipAssignedRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionJoinRequest" ADD CONSTRAINT "InstitutionJoinRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionJoinRequest" ADD CONSTRAINT "InstitutionJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionJoinRequest" ADD CONSTRAINT "InstitutionJoinRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionAcademicFramework" ADD CONSTRAINT "InstitutionAcademicFramework_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplateGrade" ADD CONSTRAINT "CurriculumTemplateGrade_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplateSubject" ADD CONSTRAINT "CurriculumTemplateSubject_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplateGradeSubject" ADD CONSTRAINT "CurriculumTemplateGradeSubject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "CurriculumTemplateGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplateGradeSubject" ADD CONSTRAINT "CurriculumTemplateGradeSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "CurriculumTemplateSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramGrade" ADD CONSTRAINT "ProgramGrade_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSubject" ADD CONSTRAINT "ProgramSubject_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramGradeSubject" ADD CONSTRAINT "ProgramGradeSubject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "ProgramGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramGradeSubject" ADD CONSTRAINT "ProgramGradeSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ProgramSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRoom" ADD CONSTRAINT "ClassRoom_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRoom" ADD CONSTRAINT "ClassRoom_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRoom" ADD CONSTRAINT "ClassRoom_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "ProgramGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateStudentField" ADD CONSTRAINT "TemplateStudentField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianLink" ADD CONSTRAINT "StudentGuardianLink_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianLink" ADD CONSTRAINT "StudentGuardianLink_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianLink" ADD CONSTRAINT "StudentGuardianLink_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianLink" ADD CONSTRAINT "StudentGuardianLink_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFieldValue" ADD CONSTRAINT "StudentFieldValue_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFieldValue" ADD CONSTRAINT "StudentFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "TemplateStudentField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProfile" ADD CONSTRAINT "SocialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProfile" ADD CONSTRAINT "SocialProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_authorInstitutionId_fkey" FOREIGN KEY ("authorInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_socialProfileId_fkey" FOREIGN KEY ("socialProfileId") REFERENCES "SocialProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentComment" ADD CONSTRAINT "MomentComment_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentComment" ADD CONSTRAINT "MomentComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentStar" ADD CONSTRAINT "MomentStar_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentStar" ADD CONSTRAINT "MomentStar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tribe" ADD CONSTRAINT "Tribe_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tribe" ADD CONSTRAINT "Tribe_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeMember" ADD CONSTRAINT "TribeMember_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "Tribe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeMember" ADD CONSTRAINT "TribeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeMoment" ADD CONSTRAINT "TribeMoment_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "Tribe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeMoment" ADD CONSTRAINT "TribeMoment_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followedUserId_fkey" FOREIGN KEY ("followedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionFollow" ADD CONSTRAINT "InstitutionFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionFollow" ADD CONSTRAINT "InstitutionFollow_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeBeneficiary" ADD CONSTRAINT "HopeBeneficiary_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeApplication" ADD CONSTRAINT "HopeApplication_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "HopeBeneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeApplication" ADD CONSTRAINT "HopeApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeApplication" ADD CONSTRAINT "HopeApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeDonation" ADD CONSTRAINT "HopeDonation_donorUserId_fkey" FOREIGN KEY ("donorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeDonationAllocation" ADD CONSTRAINT "HopeDonationAllocation_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "HopeDonation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeDonationAllocation" ADD CONSTRAINT "HopeDonationAllocation_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "HopeBeneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopeDonationAllocation" ADD CONSTRAINT "HopeDonationAllocation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionEvent" ADD CONSTRAINT "InstitutionEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeDefinition" ADD CONSTRAINT "BadgeDefinition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_badgeDefinitionId_fkey" FOREIGN KEY ("badgeDefinitionId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_awardedToUserId_fkey" FOREIGN KEY ("awardedToUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_awardedByUserId_fkey" FOREIGN KEY ("awardedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AccountIntent,
  InstitutionCategory,
  InstitutionJoinRequestStatus,
  MembershipStatus,
  MembershipType,
  OnboardingRoute,
} from "@prisma/client";
import { randomBytes } from "crypto";

import { PrismaService } from "../prisma/prisma.service";
import { InstitutionAccessSetupService } from "../institutions/institution-access-setup.service";

import { StartOnboardingDto } from "./dto/start-onboarding.dto";
import { SetProfileDto } from "./dto/set-profile.dto";
import { CreateInstitutionOnboardingDto } from "./dto/create-institution-onboarding.dto";
import { RequestJoinDto } from "./dto/request-join.dto";

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly institutionAccessSetup: InstitutionAccessSetupService
  ) {}

  async getStatus(userId: string) {
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        route: true,
        accountIntent: true,
        institutionTypeDraft: true,
        institutionNameDraft: true,
        nationalityCodeDraft: true,
        residenceCountryCodeDraft: true,
        headlineDraft: true,
        ownershipDraft: true,
        levelTypeDraft: true,
        learningModesDraft: true,
        genderAdmissionPolicyDraft: true,
        currentStep: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        membershipType: true,
        status: true,
        isPrimary: true,
        joinedAt: true,
        createdAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
            institutionType: true,
            institutionCategory: true,
            verificationStatus: true,
          },
        },
      },
    });

    return {
      completed: !!onboarding?.completedAt,
      onboarding,
      memberships,
    };
  }

  async start(userId: string, dto: StartOnboardingDto) {
    const route =
      dto.accountIntent === AccountIntent.FOUNDER
        ? OnboardingRoute.BUILD_INSTITUTION
        : OnboardingRoute.PERSONAL_ACCOUNT;

    return this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route,
        accountIntent: dto.accountIntent,
        currentStep: "start",
      },
      update: {
        route,
        accountIntent: dto.accountIntent,
        currentStep: "start",
      },
    });
  }

  async setProfile(userId: string, dto: SetProfileDto) {
    const nationalityCode = this.normalizeCountryCode(dto.nationalityCode);
    const residenceCountryCode = this.normalizeCountryCode(
      dto.residenceCountryCode
    );
    const headline = this.normalizeOptionalText(dto.headline);

    await this.ensureCountryExists(nationalityCode);
    await this.ensureCountryExists(residenceCountryCode);

    const onboarding = await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route: OnboardingRoute.PERSONAL_ACCOUNT,
        nationalityCodeDraft: nationalityCode,
        residenceCountryCodeDraft: residenceCountryCode,
        headlineDraft: headline,
        currentStep: "profile",
      },
      update: {
        nationalityCodeDraft: nationalityCode,
        residenceCountryCodeDraft: residenceCountryCode,
        headlineDraft: headline,
        currentStep: "profile",
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        nationalityCode,
        residenceCountryCode,
        headline: headline ?? undefined,
        lastActiveAt: new Date(),
      },
    });

    return {
      message: "Profile onboarding saved successfully",
      onboarding,
    };
  }

  async createInstitution(
    userId: string,
    dto: CreateInstitutionOnboardingDto
  ) {
    const cleanedName = this.normalizeInstitutionName(dto.name);
    const slug = await this.generateUniqueInstitutionSlug(cleanedName);

    const countryCode = dto.countryCode
      ? this.normalizeCountryCode(dto.countryCode)
      : null;

    if (countryCode) {
      await this.ensureCountryExists(countryCode);
    }

    if (dto.subdivisionId) {
      await this.ensureSubdivisionExists(dto.subdivisionId);
    }

    if (dto.cityId) {
      await this.ensureCityExists(dto.cityId);
    }

    const legalName = this.normalizeOptionalText(dto.legalName);
    const email = this.normalizeOptionalEmail(dto.email);
    const primaryPhone = this.normalizeOptionalText(dto.primaryPhone);
    const websiteUrl = this.normalizeOptionalText(dto.websiteUrl);
    const addressLine1 = this.normalizeOptionalText(dto.addressLine1);
    const addressLine2 = this.normalizeOptionalText(dto.addressLine2);
    const timezone = this.normalizeOptionalText(dto.timezone);
    const ownership = this.normalizeOptionalText(dto.ownership);
    const levelType = this.normalizeOptionalText(dto.levelType);

    const result = await this.prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          name: cleanedName,
          slug,
          institutionType: dto.institutionType,
          institutionCategory:
            dto.institutionCategory ??
            this.mapInstitutionCategory(dto.institutionType),
          legalName,
          email,
          primaryPhone,
          websiteUrl,
          countryCode,
          subdivisionId: dto.subdivisionId ?? null,
          cityId: dto.cityId ?? null,
          addressLine1,
          addressLine2,
          timezone,
          ownership,
          levelType,
          genderAdmissionPolicy: dto.genderAdmissionPolicy ?? null,
          learningModes: dto.learningModes ?? [],
          onboardingCompletedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          institutionType: true,
          institutionCategory: true,
          countryCode: true,
          verificationStatus: true,
          createdAt: true,
        },
      });

      const ownerMembership = await tx.membership.create({
        data: {
          userId,
          institutionId: institution.id,
          membershipType: MembershipType.OWNER,
          status: MembershipStatus.ACTIVE,
          isPrimary: true,
          joinedAt: new Date(),
        },
        select: {
          id: true,
          institutionId: true,
          userId: true,
        },
      });

      await tx.membership.updateMany({
        where: {
          userId,
          id: { not: ownerMembership.id },
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      await tx.userOnboarding.upsert({
        where: { userId },
        create: {
          userId,
          route: OnboardingRoute.BUILD_INSTITUTION,
          accountIntent: AccountIntent.FOUNDER,
          institutionTypeDraft: dto.institutionType,
          institutionNameDraft: cleanedName,
          residenceCountryCodeDraft: countryCode,
          ownershipDraft: ownership,
          levelTypeDraft: levelType,
          learningModesDraft: dto.learningModes ?? [],
          genderAdmissionPolicyDraft: dto.genderAdmissionPolicy ?? null,
          currentStep: "institution-created",
          completedAt: new Date(),
        },
        update: {
          route: OnboardingRoute.BUILD_INSTITUTION,
          accountIntent: AccountIntent.FOUNDER,
          institutionTypeDraft: dto.institutionType,
          institutionNameDraft: cleanedName,
          residenceCountryCodeDraft: countryCode,
          ownershipDraft: ownership,
          levelTypeDraft: levelType,
          learningModesDraft: dto.learningModes ?? [],
          genderAdmissionPolicyDraft: dto.genderAdmissionPolicy ?? null,
          currentStep: "institution-created",
          completedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          onboardingCompletedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });

      return {
        institution,
        ownerMembership,
      };
    });

    await this.institutionAccessSetup.bootstrapInstitutionAccess({
      institutionId: result.institution.id,
      ownerMembershipId: result.ownerMembership.id,
    });

    const hydratedInstitution = await this.prisma.institution.findUnique({
      where: { id: result.institution.id },
      include: {
        departments: {
          orderBy: { name: "asc" },
        },
        roleDefinitions: {
          orderBy: { name: "asc" },
          include: {
            permissions: {
              orderBy: { permission: "asc" },
            },
          },
        },
      },
    });

    return {
      message: "Institution created successfully",
      institution: hydratedInstitution,
      ownerMembershipId: result.ownerMembership.id,
    };
  }

  async requestJoin(userId: string, dto: RequestJoinDto) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: dto.institutionId },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
      },
    });

    if (!institution) {
      throw new BadRequestException("Institution not found");
    }

    const existingMembership = await this.prisma.membership.findFirst({
      where: {
        userId,
        institutionId: dto.institutionId,
      },
      select: {
        id: true,
        status: true,
        membershipType: true,
      },
    });

    if (existingMembership) {
      throw new BadRequestException(
        "You already have a relationship with this institution"
      );
    }

    const existingRequest = await this.prisma.institutionJoinRequest.findFirst({
      where: {
        userId,
        institutionId: dto.institutionId,
        requestType: dto.requestType,
        status: InstitutionJoinRequestStatus.PENDING,
      },
      select: { id: true },
    });

    if (existingRequest) {
      throw new BadRequestException("A pending join request already exists");
    }

    const joinRequest = await this.prisma.institutionJoinRequest.create({
      data: {
        userId,
        institutionId: dto.institutionId,
        requestType: dto.requestType,
        status: InstitutionJoinRequestStatus.PENDING,
        note: this.normalizeOptionalText(dto.note),
        referenceNumber: this.normalizeOptionalText(dto.referenceNumber),
        admissionNo: this.normalizeOptionalText(dto.admissionNo),
        staffNo: this.normalizeOptionalText(dto.staffNo),
      },
      select: {
        id: true,
        requestType: true,
        status: true,
        createdAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route: OnboardingRoute.PERSONAL_ACCOUNT,
        currentStep: "join-request-submitted",
      },
      update: {
        route: OnboardingRoute.PERSONAL_ACCOUNT,
        currentStep: "join-request-submitted",
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return {
      message: "Join request submitted successfully",
      joinRequest,
    };
  }

  private mapInstitutionCategory(
    institutionType: CreateInstitutionOnboardingDto["institutionType"]
  ): InstitutionCategory {
    switch (institutionType) {
      case "SCHOOL":
      case "COLLEGE":
      case "UNIVERSITY":
      case "POLYTECHNIC":
      case "VOCATIONAL":
      case "TRAINING_CENTER":
      case "ACADEMY":
        return "SCHOOL";

      case "GOVERNMENT_BODY":
        return "GOVERNMENT";

      case "NGO":
      case "CHILDREN_HOME":
        return "NGO";

      case "EXAM_BODY":
      case "SPORTS_BODY":
      case "DRAMA_BODY":
        return "COMPETITION_BODY";

      case "LOAN_BODY":
        return "SUPPORT_BODY";

      default:
        return "OTHER";
    }
  }

  private async generateUniqueInstitutionSlug(name: string) {
    const base =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "institution";

    for (let i = 0; i < 20; i++) {
      const suffix = i === 0 ? "" : `-${this.randomNumericSuffix(4)}`;
      const candidate = `${base}${suffix}`;

      const exists = await this.prisma.institution.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }
    }

    throw new BadRequestException("Unable to generate unique institution slug");
  }

  private randomNumericSuffix(length: number) {
    const digits = "0123456789";
    const bytes = randomBytes(length);
    let result = "";

    for (let i = 0; i < length; i++) {
      result += digits[bytes[i] % digits.length];
    }

    return result;
  }

  private normalizeInstitutionName(value: string) {
    const cleaned = value.replace(/\s+/g, " ").trim();

    if (cleaned.length < 2) {
      throw new BadRequestException("Institution name is required");
    }

    return cleaned;
  }

  private normalizeCountryCode(value: string) {
    const cleaned = value.trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(cleaned)) {
      throw new BadRequestException("Invalid country code");
    }

    return cleaned;
  }

  private normalizeOptionalEmail(value?: string | null) {
    if (!value) return null;
    return value.trim().toLowerCase();
  }

  private normalizeOptionalText(value?: string | null) {
    if (!value) return null;
    const cleaned = value.trim();
    return cleaned.length ? cleaned : null;
  }

  private async ensureCountryExists(code: string) {
    const country = await this.prisma.geoCountry.findUnique({
      where: { code },
      select: { id: true, isActive: true },
    });

    if (!country || !country.isActive) {
      throw new BadRequestException("Selected country is not available");
    }
  }

  private async ensureSubdivisionExists(id: string) {
    const row = await this.prisma.geoSubdivision.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!row) {
      throw new BadRequestException("Selected subdivision is not available");
    }
  }

  private async ensureCityExists(id: string) {
    const row = await this.prisma.geoCity.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!row) {
      throw new BadRequestException("Selected city is not available");
    }
  }
}
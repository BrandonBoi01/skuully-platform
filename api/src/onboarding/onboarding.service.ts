import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import {
  AccountIntent,
  GenderAdmissionPolicy,
  InstitutionType,
  OnboardingRoute,
  VerificationPurpose,
} from "@prisma/client";
import { randomInt } from "crypto";

import { PrismaService } from "../prisma/prisma.service";
import { SmsService } from "../shared/sms/sms.service";
import { SchoolsService } from "../schools/schools.service";
import { SetOnboardingRouteDto } from "./dto/set-onboarding-route.dto";
import { SaveBuildIdentityDto } from "./dto/save-build-identity.dto";
import { SaveBuildAcademicDto } from "./dto/save-build-academic.dto";
import { SaveBuildDetailsDto } from "./dto/save-build-details.dto";
import { SendPhoneCodeDto } from "./dto/send-phone-code.dto";
import { VerifyPhoneCodeDto } from "./dto/verify-phone-code.dto";
import { SavePersonalIdentityDto } from "./dto/save-personal-identity.dto";

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly schoolsService: SchoolsService
  ) {}

  async getMyOnboarding(userId: string) {
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      select: {
        route: true,
        accountIntent: true,
        currentStep: true,
        completedAt: true,
        institutionTypeDraft: true,
        institutionNameDraft: true,
        countryDraft: true,
        countryCodeDraft: true,
        skuullyIdDraft: true,
        personalHeadlineDraft: true,
        dateOfBirthDraft: true,
        academicLabelDraft: true,
        academicItemsDraft: true,
        academicSetLater: true,
        learningModesDraft: true,
        ownershipDraft: true,
        levelTypeDraft: true,
        genderAdmissionPolicyDraft: true,
        phoneCountryCodeDraft: true,
        phoneDialCodeDraft: true,
        phoneNationalDraft: true,
        phoneE164Draft: true,
        phoneSetLater: true,
      },
    });

    return {
      route: onboarding?.route ?? null,
      accountIntent: onboarding?.accountIntent ?? null,
      currentStep: onboarding?.currentStep ?? null,
      completedAt: onboarding?.completedAt ?? null,
      draft: onboarding
        ? {
            accountIntent: onboarding.accountIntent,
            institutionType: onboarding.institutionTypeDraft,
            institutionName: onboarding.institutionNameDraft,
            country: onboarding.countryDraft,
            countryCode: onboarding.countryCodeDraft,
            skuullyId: onboarding.skuullyIdDraft,
            personalHeadline: onboarding.personalHeadlineDraft,
            dateOfBirth: onboarding.dateOfBirthDraft,
            academicLabel: onboarding.academicLabelDraft,
            academicItems: onboarding.academicItemsDraft ?? [],
            academicSetLater: onboarding.academicSetLater,
            learningModes: onboarding.learningModesDraft ?? [],
            ownership: onboarding.ownershipDraft,
            levelType: onboarding.levelTypeDraft,
            genderAdmissionPolicy: onboarding.genderAdmissionPolicyDraft,
            phoneCountryCode: onboarding.phoneCountryCodeDraft,
            phoneDialCode: onboarding.phoneDialCodeDraft,
            phoneNational: onboarding.phoneNationalDraft,
            phoneE164: onboarding.phoneE164Draft,
            phoneSetLater: onboarding.phoneSetLater,
          }
        : null,
    };
  }

  async setRoute(userId: string, dto: SetOnboardingRouteDto) {
    await this.ensureUserExists(userId);

    const isBuild = dto.route === OnboardingRoute.BUILD_INSTITUTION;
    const isPersonal = dto.route === OnboardingRoute.PERSONAL_ACCOUNT;

    const onboarding = await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route: dto.route,
        currentStep: "route",

        ...(isBuild
          ? {
              accountIntent: null,
              skuullyIdDraft: null,
              personalHeadlineDraft: null,
              dateOfBirthDraft: null,
            }
          : {}),

        ...(isPersonal
          ? {
              institutionTypeDraft: null,
              institutionNameDraft: null,
              countryDraft: null,
              countryCodeDraft: null,
              academicLabelDraft: null,
              academicItemsDraft: [],
              academicSetLater: false,
              learningModesDraft: [],
              genderAdmissionPolicyDraft: null,
              ownershipDraft: null,
              levelTypeDraft: null,
            }
          : {}),
      },
      update: {
        route: dto.route,
        currentStep: "route",

        ...(isBuild
          ? {
              accountIntent: null,
              skuullyIdDraft: null,
              personalHeadlineDraft: null,
              dateOfBirthDraft: null,
            }
          : {}),

        ...(isPersonal
          ? {
              institutionTypeDraft: null,
              institutionNameDraft: null,
              countryDraft: null,
              countryCodeDraft: null,
              academicLabelDraft: null,
              academicItemsDraft: [],
              academicSetLater: false,
              learningModesDraft: [],
              genderAdmissionPolicyDraft: null,
              ownershipDraft: null,
              levelTypeDraft: null,
            }
          : {}),
      },
      select: {
        route: true,
        currentStep: true,
      },
    });

    return {
      message: "Onboarding route saved",
      route: onboarding.route,
      currentStep: onboarding.currentStep,
    };
  }

  /* ---------------- BUILD INSTITUTION ---------------- */

  async saveBuildIdentity(userId: string, dto: SaveBuildIdentityDto) {
    await this.ensureVerifiedUser(userId);

    const onboarding = await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route: OnboardingRoute.BUILD_INSTITUTION,
        currentStep: "identity",
        institutionTypeDraft: dto.institutionType,
        institutionNameDraft: dto.institutionName.trim(),
        countryDraft: dto.country.trim(),
        countryCodeDraft: dto.countryCode.trim().toUpperCase(),
      },
      update: {
        route: OnboardingRoute.BUILD_INSTITUTION,
        currentStep: "identity",
        institutionTypeDraft: dto.institutionType,
        institutionNameDraft: dto.institutionName.trim(),
        countryDraft: dto.country.trim(),
        countryCodeDraft: dto.countryCode.trim().toUpperCase(),
      },
    });

    return {
      message: "Identity step saved",
      currentStep: onboarding.currentStep,
    };
  }

  getAcademicOptions(institutionType: string, countryCode: string) {
    const type = String(institutionType || "").toUpperCase() as InstitutionType;
    const code = String(countryCode || "").toUpperCase();

    if (type === InstitutionType.SCHOOL || type === InstitutionType.ACADEMY) {
      const options = [
        ...(code === "KE"
          ? [
              {
                label: "CBC",
                code: "KE_CBC",
                category: "national",
                recommended: true,
              },
              {
                label: "8-4-4",
                code: "KE_844",
                category: "legacy",
              },
            ]
          : []),
        {
          label: "Cambridge Curriculum",
          code: "CAM_IGCSE",
          category: "international",
        },
        {
          label: "International Baccalaureate (IB)",
          code: "IB",
          category: "international",
        },
        {
          label: "American Curriculum",
          code: "US_GENERAL",
          category: "international",
        },
        {
          label: "British Curriculum",
          code: "BRITISH",
          category: "international",
        },
        {
          label: "CBSE",
          code: "CBSE",
          category: "international",
        },
        {
          label: "Montessori",
          code: "MONTESSORI",
          category: "alternative",
        },
      ];

      return {
        label: "Curricula",
        description:
          "Choose one or more curricula for your institution, or set them up later.",
        options,
      };
    }

    if (
      type === InstitutionType.COLLEGE ||
      type === InstitutionType.UNIVERSITY
    ) {
      return {
        label: "Academic frameworks",
        description:
          "Choose one or more academic frameworks, or leave them for later.",
        options: [
          { label: "Semester-based", category: "academic_framework" },
          { label: "Trimester-based", category: "academic_framework" },
          { label: "Modular", category: "academic_framework" },
          { label: "Credit-hour system", category: "academic_framework" },
          { label: "Competency-based", category: "academic_framework" },
          { label: "Outcome-based", category: "academic_framework" },
        ],
      };
    }

    return {
      label: "Training frameworks",
      description:
        "Choose one or more training frameworks, or set them up later.",
      options: [
        { label: "Certification-based", category: "training_framework" },
        { label: "Competency-based", category: "training_framework" },
        { label: "Module-based", category: "training_framework" },
        { label: "Workshop-led", category: "training_framework" },
        { label: "Industry-aligned", category: "training_framework" },
      ],
    };
  }

  async saveBuildAcademic(userId: string, dto: SaveBuildAcademicDto) {
    await this.ensureVerifiedUser(userId);

    const uniqueItems = [
      ...new Set(
        (dto.selectedItems ?? []).map((item) => item.trim()).filter(Boolean)
      ),
    ];

    const onboarding = await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route: OnboardingRoute.BUILD_INSTITUTION,
        currentStep: "academic",
        academicLabelDraft: dto.label?.trim() || null,
        academicItemsDraft: uniqueItems,
        academicSetLater: dto.setUpLater,
      },
      update: {
        route: OnboardingRoute.BUILD_INSTITUTION,
        currentStep: "academic",
        academicLabelDraft: dto.label?.trim() || null,
        academicItemsDraft: uniqueItems,
        academicSetLater: dto.setUpLater,
      },
    });

    return {
      message: "Academic step saved",
      currentStep: onboarding.currentStep,
    };
  }

  getDetailOptions(institutionType: string) {
    const type = String(institutionType || "").toUpperCase() as InstitutionType;

    const genderOptions = [
      { label: "Boys only", value: GenderAdmissionPolicy.BOYS_ONLY },
      { label: "Girls only", value: GenderAdmissionPolicy.GIRLS_ONLY },
      { label: "Mixed", value: GenderAdmissionPolicy.MIXED },
    ];

    switch (type) {
      case InstitutionType.SCHOOL:
        return {
          learningModes: ["DAY", "BOARDING", "ONLINE", "HYBRID", "IN_PERSON"],
          ownerships: ["Private", "Public", "International"],
          levelTypes: ["Primary", "Secondary", "Combined"],
          genderAdmissionPolicies: genderOptions,
        };

      case InstitutionType.COLLEGE:
        return {
          learningModes: ["IN_PERSON", "HYBRID", "ONLINE", "DAY", "BOARDING"],
          ownerships: ["Private", "Public"],
          levelTypes: ["Certificate", "Diploma", "Mixed"],
          genderAdmissionPolicies: genderOptions,
        };

      case InstitutionType.UNIVERSITY:
        return {
          learningModes: ["IN_PERSON", "HYBRID", "ONLINE", "DAY", "BOARDING"],
          ownerships: ["Private", "Public"],
          levelTypes: ["Undergraduate", "Postgraduate", "Both"],
          genderAdmissionPolicies: genderOptions,
        };

      default:
        return {
          learningModes: ["IN_PERSON", "HYBRID", "ONLINE", "DAY", "BOARDING"],
          ownerships: ["Private", "Public"],
          levelTypes: ["General"],
          genderAdmissionPolicies: genderOptions,
        };
    }
  }

  async saveBuildDetails(userId: string, dto: SaveBuildDetailsDto) {
    await this.ensureVerifiedUser(userId);

    const onboarding = await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route: OnboardingRoute.BUILD_INSTITUTION,
        currentStep: "details",
        learningModesDraft: dto.learningModes,
        ownershipDraft: dto.ownership?.trim() || null,
        levelTypeDraft: dto.levelType?.trim() || null,
        genderAdmissionPolicyDraft: dto.genderAdmissionPolicy ?? null,
      },
      update: {
        route: OnboardingRoute.BUILD_INSTITUTION,
        currentStep: "details",
        learningModesDraft: dto.learningModes,
        ownershipDraft: dto.ownership?.trim() || null,
        levelTypeDraft: dto.levelType?.trim() || null,
        genderAdmissionPolicyDraft: dto.genderAdmissionPolicy ?? null,
      },
    });

    return {
      message: "Details step saved",
      currentStep: onboarding.currentStep,
    };
  }

  async getBuildReview(userId: string) {
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      throw new BadRequestException("No onboarding draft found");
    }

    return {
      institutionType: onboarding.institutionTypeDraft,
      institutionName: onboarding.institutionNameDraft,
      country: onboarding.countryDraft,
      countryCode: onboarding.countryCodeDraft,
      academicLabel: onboarding.academicLabelDraft,
      academicItems: onboarding.academicItemsDraft,
      academicSetLater: onboarding.academicSetLater,
      learningModes: onboarding.learningModesDraft,
      ownership: onboarding.ownershipDraft,
      levelType: onboarding.levelTypeDraft,
      genderAdmissionPolicy: onboarding.genderAdmissionPolicyDraft,
      phone: onboarding.phoneE164Draft,
      phoneSetLater: onboarding.phoneSetLater,
    };
  }

  async completeBuildInstitution(userId: string) {
    await this.ensureVerifiedUser(userId);

    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      select: {
        institutionTypeDraft: true,
        institutionNameDraft: true,
        countryDraft: true,
        countryCodeDraft: true,
        academicLabelDraft: true,
        academicItemsDraft: true,
        academicSetLater: true,
        learningModesDraft: true,
        ownershipDraft: true,
        levelTypeDraft: true,
        genderAdmissionPolicyDraft: true,
        phoneCountryCodeDraft: true,
        phoneDialCodeDraft: true,
        phoneNationalDraft: true,
        phoneE164Draft: true,
        phoneSetLater: true,
      },
    });

    if (!onboarding) {
      throw new BadRequestException("No onboarding draft found");
    }

    if (
      !onboarding.institutionTypeDraft ||
      !onboarding.institutionNameDraft ||
      !onboarding.countryDraft ||
      !onboarding.countryCodeDraft
    ) {
      throw new BadRequestException("Onboarding is incomplete");
    }

    return this.schoolsService.createSchool(userId, {
      name: onboarding.institutionNameDraft,
      country: onboarding.countryDraft,
      countryCode: onboarding.countryCodeDraft,
      institutionType: onboarding.institutionTypeDraft,
      organizationName: onboarding.institutionNameDraft,
      branchName: "Main Campus",
      curriculumName:
        onboarding.academicSetLater || !(onboarding.academicItemsDraft ?? []).length
          ? undefined
          : onboarding.academicItemsDraft![0],
      academicSetup: {
        label: onboarding.academicLabelDraft ?? undefined,
        selectedItems: onboarding.academicItemsDraft ?? [],
        setUpLater: onboarding.academicSetLater,
      },
      institutionProfile: {
        learningModes: onboarding.learningModesDraft ?? [],
        ownership: onboarding.ownershipDraft ?? undefined,
        levelType: onboarding.levelTypeDraft ?? undefined,
        genderAdmissionPolicy:
          onboarding.genderAdmissionPolicyDraft ?? GenderAdmissionPolicy.MIXED,
      },
      security: {
        addPhoneLater: onboarding.phoneSetLater,
        phone:
          onboarding.phoneSetLater || !onboarding.phoneE164Draft
            ? null
            : {
                countryCode: onboarding.phoneCountryCodeDraft ?? undefined,
                dialCode: onboarding.phoneDialCodeDraft ?? undefined,
                nationalNumber: onboarding.phoneNationalDraft ?? undefined,
                e164: onboarding.phoneE164Draft,
              },
      },
    } as any);
  }

  /* ---------------- PERSONAL ACCOUNT ---------------- */

  async savePersonalIdentity(userId: string, dto: SavePersonalIdentityDto) {
    await this.ensureVerifiedUser(userId);

    const skuullyId = this.normalizeSkuullyId(dto.skuullyId);
    const fullName = dto.fullName.trim();
    const headline = dto.headline?.trim() || null;
    const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    const accountIntent = dto.accountIntent as AccountIntent;
    const { firstName, lastName } = this.splitName(fullName);

    if (skuullyId.length < 3) {
      throw new BadRequestException("Skuully ID must be at least 3 characters");
    }

    if (fullName.length < 2) {
      throw new BadRequestException("Full name is required");
    }

    if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
      throw new BadRequestException("Date of birth is invalid");
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        skuullyId,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Skuully ID is already taken");
    }

    const isMinor = dateOfBirth ? this.computeIsMinor(dateOfBirth) : false;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName,
          firstName,
          lastName,
          headline,
          dateOfBirth,
          isMinor,
        },
      }),
      this.prisma.userOnboarding.upsert({
        where: { userId },
        create: {
          userId,
          route: OnboardingRoute.PERSONAL_ACCOUNT,
          currentStep: "identity",
          accountIntent,
          skuullyIdDraft: skuullyId,
          personalHeadlineDraft: headline,
          dateOfBirthDraft: dateOfBirth,
        },
        update: {
          route: OnboardingRoute.PERSONAL_ACCOUNT,
          currentStep: "identity",
          accountIntent,
          skuullyIdDraft: skuullyId,
          personalHeadlineDraft: headline,
          dateOfBirthDraft: dateOfBirth,
        },
      }),
    ]);

    return {
      message: "Personal identity saved",
    };
  }

  async completePersonalAccount(userId: string) {
    await this.ensureVerifiedUser(userId);

    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      select: {
        skuullyIdDraft: true,
        personalHeadlineDraft: true,
        dateOfBirthDraft: true,
        accountIntent: true,
      },
    });

    if (!onboarding?.skuullyIdDraft) {
      throw new BadRequestException("Skuully ID is missing");
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        skuullyId: onboarding.skuullyIdDraft,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Skuully ID is already taken");
    }

    const isMinor = onboarding.dateOfBirthDraft
      ? this.computeIsMinor(onboarding.dateOfBirthDraft)
      : false;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          skuullyId: onboarding.skuullyIdDraft,
          headline: onboarding.personalHeadlineDraft ?? undefined,
          dateOfBirth: onboarding.dateOfBirthDraft ?? undefined,
          isMinor,
          onboardingCompletedAt: new Date(),
        },
      }),
      this.prisma.userOnboarding.update({
        where: { userId },
        data: {
          route: OnboardingRoute.PERSONAL_ACCOUNT,
          currentStep: "completed",
          completedAt: new Date(),
        },
      }),
    ]);

    return {
      message: "Personal account setup completed",
    };
  }

  /* ---------------- SHARED SECURITY ---------------- */

  async sendPhoneCode(userId: string, dto: SendPhoneCodeDto) {
    await this.ensureVerifiedUser(userId);

    const e164 = dto.e164.trim();

    if (!e164.startsWith("+")) {
      throw new BadRequestException("Phone number must be in E.164 format");
    }

    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      select: { route: true },
    });

    const activeRoute = onboarding?.route ?? OnboardingRoute.PERSONAL_ACCOUNT;
    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.phoneVerificationCode.updateMany({
        where: {
          userId,
          phone: e164,
          purpose: VerificationPurpose.PHONE_VERIFY,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.phoneVerificationCode.create({
        data: {
          userId,
          phone: e164,
          code,
          purpose: VerificationPurpose.PHONE_VERIFY,
          expiresAt,
        },
      }),
      this.prisma.userOnboarding.upsert({
        where: { userId },
        create: {
          userId,
          route: activeRoute,
          currentStep: "security",
          phoneCountryCodeDraft: dto.countryCode.trim().toUpperCase(),
          phoneDialCodeDraft: dto.dialCode.trim(),
          phoneNationalDraft: dto.nationalNumber.trim(),
          phoneE164Draft: e164,
          phoneSetLater: false,
        },
        update: {
          route: activeRoute,
          currentStep: "security",
          phoneCountryCodeDraft: dto.countryCode.trim().toUpperCase(),
          phoneDialCodeDraft: dto.dialCode.trim(),
          phoneNationalDraft: dto.nationalNumber.trim(),
          phoneE164Draft: e164,
          phoneSetLater: false,
        },
      }),
    ]);

    await this.sms.sendVerificationCode({
      to: e164,
      code,
    });

    return {
      message: "Verification code sent",
      expiresInSeconds: 600,
    };
  }

  async verifyPhoneCode(userId: string, dto: VerifyPhoneCodeDto) {
    await this.ensureVerifiedUser(userId);

    const e164 = dto.e164.trim();
    const code = dto.code.trim();

    const record = await this.prisma.phoneVerificationCode.findFirst({
      where: {
        userId,
        phone: e164,
        code,
        purpose: VerificationPurpose.PHONE_VERIFY,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!record) {
      throw new BadRequestException(
        "Invalid or expired phone verification code"
      );
    }

    await this.prisma.$transaction([
      this.prisma.phoneVerificationCode.update({
        where: { id: record.id },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          phone: e164,
          phoneVerifiedAt: new Date(),
        },
      }),
      this.prisma.userOnboarding.update({
        where: { userId },
        data: {
          phoneE164Draft: e164,
          phoneSetLater: false,
          currentStep: "security",
        },
      }),
    ]);

    return {
      message: "Phone verified successfully",
      verified: true,
      phoneVerified: true,
      phone: e164,
    };
  }

  async skipPhone(userId: string) {
    await this.ensureVerifiedUser(userId);

    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      select: { route: true },
    });

    const activeRoute = onboarding?.route ?? OnboardingRoute.PERSONAL_ACCOUNT;

    await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        route: activeRoute,
        currentStep: "security",
        phoneSetLater: true,
      },
      update: {
        route: activeRoute,
        currentStep: "security",
        phoneSetLater: true,
      },
    });

    return {
      message: "Phone step skipped",
    };
  }

  /* ---------------- HELPERS ---------------- */

  private normalizeSkuullyId(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/^@+/, "")
      .replace(/[^a-z0-9._]/g, "")
      .replace(/\.\.+/g, ".")
      .replace(/__+/g, "_")
      .replace(/^\.|\.$/g, "")
      .slice(0, 24);
  }

  private splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? null;
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

    return { firstName, lastName };
  }

  private computeIsMinor(dateOfBirth: Date) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age -= 1;
    }

    return age < 18;
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new ForbiddenException("User not found");
    }

    return user;
  }

  private async ensureVerifiedUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new ForbiddenException("User not found");
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException("Verify your email first");
    }

    return user;
  }
}
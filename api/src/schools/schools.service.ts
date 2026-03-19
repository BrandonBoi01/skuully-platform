import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  BranchRole,
  GenderAdmissionPolicy,
  InstitutionType,
  LearningMode,
  OrgRole,
  Prisma,
  SchoolRole,
} from "@prisma/client";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";

import { PrismaService } from "../prisma/prisma.service";
import { CreateSchoolDto } from "./dto/create-school.dto";

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async mySchools(userId: string) {
    const memberships = await this.prisma.schoolMembership.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        school: {
          select: this.schoolSelect(),
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return memberships.map((membership) => ({
      school: membership.school,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.createdAt,
    }));
  }

  private normalizeLearningModes(input?: LearningMode[] | string[] | null): LearningMode[] {
    if (!input?.length) return [];

    const valid = new Set<LearningMode>(Object.values(LearningMode));

    return [
      ...new Set(
        input
          .map((value) =>
            String(value).trim().toUpperCase().replace(/[\s-]+/g, "_")
          )
          .filter(
            (value): value is LearningMode =>
              Boolean(value) && valid.has(value as LearningMode)
          )
      ),
    ];
  }

  private normalizeGenderAdmissionPolicy(
    input?: GenderAdmissionPolicy | string | null
  ): GenderAdmissionPolicy | null {
    if (!input) return null;

    const normalized = String(input).trim().toUpperCase().replace(/[\s-]+/g, "_");

    if (normalized === "BOYS_ONLY") return GenderAdmissionPolicy.BOYS_ONLY;
    if (normalized === "GIRLS_ONLY") return GenderAdmissionPolicy.GIRLS_ONLY;
    if (normalized === "MIXED") return GenderAdmissionPolicy.MIXED;

    return null;
  }

  async createSchoolWorkspace(userId: string, dto: CreateSchoolDto) {
    return this.createSchool(userId, dto);
  }

  async createSchool(userId: string, dto: CreateSchoolDto) {
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
      throw new ForbiddenException(
        "Verify your email before creating a school workspace"
      );
    }

    const name = dto.name?.trim();
    const country = dto.country?.trim();
    const countryCode = dto.countryCode?.trim()?.toUpperCase() || null;
    const institutionType = dto.institutionType ?? InstitutionType.SCHOOL;
    const organizationName = dto.organizationName?.trim() || name;
    const branchName = dto.branchName?.trim() || "Main Campus";

    if (!name) {
      throw new ConflictException("School name is required");
    }

    if (!country) {
      throw new ConflictException("Country is required");
    }

    const academicLabel = dto.academicSetup?.label?.trim() || null;
    const academicSetUpLater = dto.academicSetup?.setUpLater ?? false;
    const selectedAcademicItems = (dto.academicSetup?.selectedItems ?? [])
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueAcademicItems = [...new Set(selectedAcademicItems)];

    const primaryAcademicItem =
      !academicSetUpLater && uniqueAcademicItems.length > 0
        ? uniqueAcademicItems[0]
        : null;

    const learningModes = this.normalizeLearningModes(
      dto.institutionProfile?.learningModes
    );
    const genderAdmissionPolicy = this.normalizeGenderAdmissionPolicy(
      dto.institutionProfile?.genderAdmissionPolicy
    );
    const ownership = dto.institutionProfile?.ownership?.trim() || null;
    const levelType = dto.institutionProfile?.levelType?.trim() || null;

    const addPhoneLater = dto.security?.addPhoneLater ?? true;
    const phonePayload = dto.security?.phone ?? null;
    const primaryPhone =
      !addPhoneLater && phonePayload?.e164?.trim()
        ? phonePayload.e164.trim()
        : null;

    const now = new Date();

    const result = await this.prisma.$transaction(
      async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: organizationName!,
            country,
          },
          select: {
            id: true,
            name: true,
            country: true,
          },
        });

        await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId,
            role: OrgRole.ORG_OWNER,
          },
        });

        const branch = await tx.branch.create({
          data: {
            organizationId: organization.id,
            name: branchName,
          },
          select: {
            id: true,
            name: true,
          },
        });

        await tx.branchMember.create({
          data: {
            branchId: branch.id,
            userId,
            role: BranchRole.BRANCH_ADMIN,
          },
        });

        const school = await tx.school.create({
          data: {
            name,
            country,
            countryCode,
            curriculum: primaryAcademicItem,
            institutionType,
            learningModes,
            genderAdmissionPolicy,
            ownership,
            levelType,
            primaryPhone,
            phoneVerifiedAt: null,
            onboardingCompletedAt: now,
            organizationId: organization.id,
            branchId: branch.id,
          },
          select: {
            id: true,
          },
        });

        const membership = await tx.schoolMembership.create({
          data: {
            schoolId: school.id,
            userId,
            role: SchoolRole.OWNER,
            status: "ACTIVE",
          },
          select: {
            id: true,
            role: true,
            status: true,
          },
        });

        if (!academicSetUpLater && uniqueAcademicItems.length > 0) {
          await tx.schoolAcademicFramework.createMany({
            data: uniqueAcademicItems.map((label, index) => ({
              schoolId: school.id,
              label,
              code: this.frameworkCodeFromLabel(label),
              category: academicLabel,
              isPrimary: index === 0,
              sortOrder: index,
            })),
          });
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            onboardingCompletedAt: now,
          },
        });

        await tx.userOnboarding.upsert({
          where: { userId },
          create: {
            userId,
            route: "BUILD_INSTITUTION",
            institutionTypeDraft: institutionType,
            institutionNameDraft: name,
            countryDraft: country,
            countryCodeDraft: countryCode,
            academicLabelDraft: academicLabel,
            academicItemsDraft: uniqueAcademicItems,
            academicSetLater: academicSetUpLater,
            learningModesDraft: learningModes,
            genderAdmissionPolicyDraft: genderAdmissionPolicy,
            ownershipDraft: ownership,
            levelTypeDraft: levelType,
            phoneCountryCodeDraft:
              !addPhoneLater && phonePayload?.countryCode
                ? phonePayload.countryCode.trim().toUpperCase()
                : null,
            phoneDialCodeDraft:
              !addPhoneLater && phonePayload?.dialCode
                ? phonePayload.dialCode.trim()
                : null,
            phoneNationalDraft:
              !addPhoneLater && phonePayload?.nationalNumber
                ? phonePayload.nationalNumber.trim()
                : null,
            phoneE164Draft: primaryPhone,
            phoneSetLater: addPhoneLater,
            currentStep: "review",
            completedAt: now,
          },
          update: {
            route: "BUILD_INSTITUTION",
            institutionTypeDraft: institutionType,
            institutionNameDraft: name,
            countryDraft: country,
            countryCodeDraft: countryCode,
            academicLabelDraft: academicLabel,
            academicItemsDraft: uniqueAcademicItems,
            academicSetLater: academicSetUpLater,
            learningModesDraft: learningModes,
            genderAdmissionPolicyDraft: genderAdmissionPolicy,
            ownershipDraft: ownership,
            levelTypeDraft: levelType,
            phoneCountryCodeDraft:
              !addPhoneLater && phonePayload?.countryCode
                ? phonePayload.countryCode.trim().toUpperCase()
                : null,
            phoneDialCodeDraft:
              !addPhoneLater && phonePayload?.dialCode
                ? phonePayload.dialCode.trim()
                : null,
            phoneNationalDraft:
              !addPhoneLater && phonePayload?.nationalNumber
                ? phonePayload.nationalNumber.trim()
                : null,
            phoneE164Draft: primaryPhone,
            phoneSetLater: addPhoneLater,
            currentStep: "review",
            completedAt: now,
          },
        });

        const hydratedSchool = await tx.school.findUnique({
          where: { id: school.id },
          select: this.schoolSelect(),
        });

        return {
          organization,
          branch,
          school: hydratedSchool!,
          membership,
        };
      },
      { timeout: 20000 }
    );

    const token = await this.jwt.signAsync({
      sub: userId,
      schoolId: result.school.id,
      role: result.membership.role,
      membershipId: result.membership.id,
    });

    return {
      message: "Your Skuully workspace is ready.",
      token,
      school: result.school,
      membership: {
        id: result.membership.id,
        role: result.membership.role,
        status: result.membership.status,
      },
      active: {
        school: result.school,
        role: result.membership.role,
        membershipId: result.membership.id,
      },
    };
  }

  async switchSchool(userId: string, schoolId: string) {
    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        userId,
        schoolId,
        status: "ACTIVE",
      },
      include: {
        school: {
          select: this.schoolSelect(),
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "You are not an active member of this school"
      );
    }

    const token = await this.jwt.signAsync({
      sub: userId,
      schoolId: membership.schoolId,
      role: membership.role,
      membershipId: membership.id,
    });

    return {
      token,
      active: {
        school: membership.school,
        role: membership.role,
        membershipId: membership.id,
      },
    };
  }

  async activeContext(
    userId: string,
    schoolId?: string | null,
    role?: string | null
  ) {
    if (!schoolId) {
      return {
        active: null,
        note: "No active school selected. Use POST /schools/switch/:schoolId",
      };
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: this.schoolSelect(),
    });

    if (!school) {
      throw new NotFoundException("School not found");
    }

    return {
      active: {
        userId,
        school,
        role: role ?? null,
      },
    };
  }

  async inviteStaff(
    schoolId: string,
    inviterRole: SchoolRole,
    email: string,
    role: SchoolRole
  ) {
    const allowedInviterRoles = new Set<SchoolRole>([
      SchoolRole.OWNER,
      SchoolRole.ADMIN,
    ]);

    if (!allowedInviterRoles.has(inviterRole)) {
      throw new ForbiddenException("Only OWNER/ADMIN can invite staff");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new ConflictException("Email is required");
    }

    if (role === SchoolRole.OWNER && inviterRole !== SchoolRole.OWNER) {
      throw new ForbiddenException("Only OWNER can invite another OWNER");
    }

    const existingActiveMembership =
      await this.prisma.schoolMembership.findFirst({
        where: {
          schoolId,
          status: "ACTIVE",
          user: {
            email: normalizedEmail,
          },
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (existingActiveMembership) {
      throw new ConflictException(
        "This user is already an active member of the school"
      );
    }

    const existingPendingInvite = await this.prisma.schoolInvite.findFirst({
      where: {
        schoolId,
        email: normalizedEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        code: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (existingPendingInvite) {
      return {
        message: "A pending invite already exists for this email",
        invite: existingPendingInvite,
      };
    }

    const code = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.schoolInvite.create({
      data: {
        schoolId,
        email: normalizedEmail,
        role,
        code,
        status: "PENDING",
        expiresAt,
      },
      select: {
        id: true,
        schoolId: true,
        email: true,
        role: true,
        code: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      message: "Invite created (email sending comes next)",
      invite,
    };
  }

  async acceptInvite(code: string, fullName: string, password: string) {
    const normalizedCode = code.trim();
    const normalizedFullName = fullName.trim();

    if (!normalizedCode) {
      throw new NotFoundException("Invite not found");
    }

    const invite = await this.prisma.schoolInvite.findUnique({
      where: { code: normalizedCode },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            country: true,
            countryCode: true,
            county: true,
            curriculum: true,
            institutionType: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException("Invite not found");
    }

    if (invite.status !== "PENDING") {
      throw new ForbiddenException("Invite not active");
    }

    if (invite.expiresAt < new Date()) {
      throw new ForbiddenException("Invite expired");
    }

    const email = invite.email.trim().toLowerCase();

    const createdOrFoundUser = await this.prisma.$transaction(
      async (tx) => {
        let user = await tx.user.findUnique({
          where: { email },
        });

        if (!user) {
          const passwordHash = await bcrypt.hash(password, 10);
          const skuullyId = await this.generateUniqueSkuullyId(
            tx,
            normalizedFullName
          );

          user = await tx.user.create({
            data: {
              fullName: normalizedFullName,
              email,
              passwordHash,
              skuullyId,
              preferredLoginMethod: "EMAIL",
              onboardingCompletedAt: new Date(),
            },
          });
        }

        let membershipId: string;

        const existingMembership = await tx.schoolMembership.findFirst({
          where: {
            userId: user.id,
            schoolId: invite.schoolId,
          },
          select: {
            id: true,
          },
        });

        if (existingMembership) {
          const updatedMembership = await tx.schoolMembership.update({
            where: { id: existingMembership.id },
            data: {
              role: invite.role,
              status: "ACTIVE",
            },
            select: {
              id: true,
            },
          });

          membershipId = updatedMembership.id;
        } else {
          const createdMembership = await tx.schoolMembership.create({
            data: {
              userId: user.id,
              schoolId: invite.schoolId,
              role: invite.role,
              status: "ACTIVE",
            },
            select: {
              id: true,
            },
          });

          membershipId = createdMembership.id;
        }

        await tx.schoolInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED" },
        });

        await tx.userOnboarding.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            route: "JOIN_INSTITUTION",
            currentStep: "completed",
            completedAt: new Date(),
          },
          update: {
            route: "JOIN_INSTITUTION",
            currentStep: "completed",
            completedAt: new Date(),
          },
        });

        return {
          user,
          membershipId,
        };
      },
      {
        timeout: 15000,
      }
    );

    const token = await this.jwt.signAsync({
      sub: createdOrFoundUser.user.id,
      schoolId: invite.schoolId,
      role: invite.role,
      membershipId: createdOrFoundUser.membershipId,
    });

    return {
      message: "Invite accepted",
      token,
      user: {
        id: createdOrFoundUser.user.id,
        fullName: createdOrFoundUser.user.fullName,
        email: createdOrFoundUser.user.email,
      },
      school: invite.school,
      role: invite.role,
      membershipId: createdOrFoundUser.membershipId,
    };
  }

  async listInvites(schoolId: string) {
    if (!schoolId) {
      throw new ForbiddenException(
        "No active school selected (missing schoolId in token)"
      );
    }

    return this.prisma.schoolInvite.findMany({
      where: { schoolId },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        role: true,
        code: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  private schoolSelect(): Prisma.SchoolSelect {
    return {
      id: true,
      name: true,
      country: true,
      countryCode: true,
      county: true,
      curriculum: true,
      institutionType: true,
      learningModes: true,
      genderAdmissionPolicy: true,
      ownership: true,
      levelType: true,
      primaryPhone: true,
      phoneVerifiedAt: true,
      onboardingCompletedAt: true,
      organizationId: true,
      branchId: true,
      createdAt: true,
      updatedAt: true,
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      academicFrameworks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          label: true,
          code: true,
          category: true,
          isPrimary: true,
          sortOrder: true,
        },
      },
    };
  }

  private frameworkCodeFromLabel(label: string): string | null {
    const value = label.trim();
    if (!value) return null;

    const known: Record<string, string> = {
      CBC: "KE_CBC",
      "8-4-4": "KE_844",
      "Cambridge Curriculum": "CAMBRIDGE",
      "International Baccalaureate (IB)": "IB",
      "American Curriculum": "US",
      "British Curriculum": "BRITISH",
      CBSE: "CBSE",
      IGCSE: "IGCSE",
      "Pearson Edexcel": "EDEXCEL",
      Montessori: "MONTESSORI",
      Waldorf: "WALDORF",
      "Semester-based": "SEMESTER",
      "Trimester-based": "TRIMESTER",
      Modular: "MODULAR",
      "Credit-hour system": "CREDIT_HOUR",
      "Competency-based": "COMPETENCY_BASED",
      "Outcome-based": "OUTCOME_BASED",
      "Research-led": "RESEARCH_LED",
      "Certification-based": "CERTIFICATION_BASED",
      "Module-based": "MODULE_BASED",
      "Workshop-led": "WORKSHOP_LED",
      "Apprenticeship-aligned": "APPRENTICESHIP",
      "Industry-aligned": "INDUSTRY_ALIGNED",
    };

    return known[value] ?? null;
  }

  private async generateUniqueSkuullyId(
    tx: Prisma.TransactionClient | PrismaService,
    fullName: string
  ): Promise<string> {
    const base =
      fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s.]/g, "")
        .replace(/\s+/g, ".")
        .replace(/\.+/g, ".")
        .replace(/^\.|\.$/g, "") || "user";

    for (let i = 0; i < 10; i++) {
      const suffix = randomBytes(2).toString("hex");
      const candidate = `${base}.${suffix}`;

      const exists = await tx.user.findUnique({
        where: { skuullyId: candidate },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }
    }

    throw new ConflictException("Could not generate unique skuullyId");
  }
}
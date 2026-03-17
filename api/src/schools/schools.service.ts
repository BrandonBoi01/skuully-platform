import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InstitutionType, SchoolRole } from "@prisma/client";
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

  // =========================================================
  // MY SCHOOLS
  // =========================================================

  async mySchools(userId: string) {
    const memberships = await this.prisma.schoolMembership.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            country: true,
            county: true,
            curriculum: true,
            institutionType: true,
            organizationId: true,
            branchId: true,
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
          },
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

  // =========================================================
  // CREATE SCHOOL WORKSPACE
  // =========================================================

  async createSchoolWorkspace(userId: string, dto: CreateSchoolDto) {
    const schoolName = dto.name.trim();
    const country = dto.country.trim();
    const institutionType = dto.institutionType ?? InstitutionType.SCHOOL;
    const organizationName = dto.organizationName?.trim() || schoolName;
    const branchName = dto.branchName?.trim() || "Main Campus";

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
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

    const template = await this.resolveCurriculumTemplate({
      country,
      curriculumCode: dto.curriculumCode?.trim(),
      curriculumName: dto.curriculumName?.trim(),
    });

    const result = await this.prisma.$transaction(
      async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
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
            role: "ORG_OWNER",
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
            role: "BRANCH_ADMIN",
          },
        });

        const school = await tx.school.create({
          data: {
            name: schoolName,
            country,
            curriculum: template.name,
            institutionType,
            organizationId: organization.id,
            branchId: branch.id,
          },
          select: {
            id: true,
            name: true,
            country: true,
            curriculum: true,
            institutionType: true,
            organizationId: true,
            branchId: true,
          },
        });

        await tx.schoolMembership.create({
          data: {
            userId,
            schoolId: school.id,
            role: SchoolRole.OWNER,
            status: "ACTIVE",
          },
        });

        const program = await tx.schoolProgram.create({
          data: {
            schoolId: school.id,
            templateId: template.id,
            name: this.defaultProgramNameForInstitutionType(institutionType),
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            status: true,
            template: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });

        return {
          organization,
          branch,
          school,
          program,
        };
      },
      {
        timeout: 15000,
      }
    );

    const token = await this.jwt.signAsync({
      sub: userId,
      schoolId: result.school.id,
      role: SchoolRole.OWNER,
      programId: result.program.id,
    });

    return {
      message: "Your Skuully workspace is ready.",
      token,
      active: {
        role: SchoolRole.OWNER,
        school: result.school,
        branch: result.branch,
        organization: result.organization,
        program: result.program,
      },
      institutionType,
    };
  }

  async createSchool(userId: string, dto: CreateSchoolDto) {
  const name = dto.name.trim();
  const country = dto.country.trim();
  const curriculum = dto.curriculumName?.trim() || null;
  const institutionType = dto.institutionType ?? "SCHOOL";
  const organizationName = dto.organizationName?.trim() || null;
  const branchName = dto.branchName?.trim() || null;

  if (!name) {
    throw new ConflictException("School name is required");
  }

  if (!country) {
    throw new ConflictException("Country is required");
  }

  const result = await this.prisma.$transaction(async (tx) => {
    let organizationId: string | null = null;
    let branchId: string | null = null;

    if (organizationName) {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          country,
        },
        select: {
          id: true,
        },
      });

      organizationId = organization.id;

      if (branchName) {
        const branch = await tx.branch.create({
          data: {
            organizationId: organization.id,
            name: branchName,
          },
          select: {
            id: true,
          },
        });

        branchId = branch.id;

        await tx.branchMember.create({
          data: {
            branchId: branch.id,
            userId,
            role: "BRANCH_ADMIN",
          },
        });
      }

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: "ORG_OWNER",
        },
      });
    }

    const school = await tx.school.create({
      data: {
        name,
        country,
        curriculum,
        institutionType,
        organizationId,
        branchId,
      },
      select: {
        id: true,
        name: true,
        country: true,
        curriculum: true,
        institutionType: true,
        organizationId: true,
        branchId: true,
        createdAt: true,
      },
    });

    const membership = await tx.schoolMembership.create({
      data: {
        schoolId: school.id,
        userId,
        role: "OWNER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        role: true,
      },
    });

    return { school, membership };
  });

  const token = await this.jwt.signAsync({
    sub: userId,
    schoolId: result.school.id,
    role: result.membership.role,
    membershipId: result.membership.id,
  });

  return {
    message: "School created successfully",
    token,
    school: result.school,
    membership: {
      id: result.membership.id,
      role: result.membership.role,
    },
    active: {
      school: result.school,
      role: result.membership.role,
      membershipId: result.membership.id,
    },
  };
}

  // =========================================================
  // SWITCH SCHOOL
  // =========================================================

  async switchSchool(userId: string, schoolId: string) {
    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        userId,
        schoolId,
        status: "ACTIVE",
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            country: true,
            county: true,
            curriculum: true,
            institutionType: true,
            organizationId: true,
            branchId: true,
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
          },
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
    });

    return {
      token,
      active: {
        school: membership.school,
        role: membership.role,
      },
    };
  }

  // =========================================================
  // ACTIVE SCHOOL CONTEXT
  // =========================================================

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
      select: {
        id: true,
        name: true,
        country: true,
        county: true,
        curriculum: true,
        institutionType: true,
        organizationId: true,
        branchId: true,
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
      },
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

  // =========================================================
  // INVITE STAFF
  // =========================================================

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

  // =========================================================
  // ACCEPT INVITE (PUBLIC)
  // =========================================================

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
            },
          });
        }

        const existingMembership = await tx.schoolMembership.findFirst({
          where: {
            userId: user.id,
            schoolId: invite.schoolId,
          },
        });

        if (existingMembership) {
          await tx.schoolMembership.update({
            where: { id: existingMembership.id },
            data: {
              role: invite.role,
              status: "ACTIVE",
            },
          });
        } else {
          await tx.schoolMembership.create({
            data: {
              userId: user.id,
              schoolId: invite.schoolId,
              role: invite.role,
              status: "ACTIVE",
            },
          });
        }

        await tx.schoolInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED" },
        });

        return user;
      },
      {
        timeout: 15000,
      }
    );

    const token = await this.jwt.signAsync({
      sub: createdOrFoundUser.id,
    });

    return {
      message: "Invite accepted",
      token,
      user: {
        id: createdOrFoundUser.id,
        fullName: createdOrFoundUser.fullName,
        email: createdOrFoundUser.email,
      },
      school: invite.school,
      role: invite.role,
      next: [
        `POST /schools/switch/${invite.schoolId}`,
        "POST /programs/switch/:programId",
      ],
    };
  }

  // =========================================================
  // LIST INVITES
  // =========================================================

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

  // =========================================================
  // CURRICULUM / PROGRAM HELPERS
  // =========================================================

  private async resolveCurriculumTemplate(input: {
    country: string;
    curriculumCode?: string;
    curriculumName?: string;
  }) {
    if (input.curriculumCode) {
      const exact = await this.prisma.curriculumTemplate.findUnique({
        where: { code: input.curriculumCode.toUpperCase() },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      if (exact) return exact;
    }

    if (input.curriculumName) {
      const byName = await this.prisma.curriculumTemplate.findFirst({
        where: {
          name: {
            equals: input.curriculumName,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      if (byName) return byName;
    }

    const suggestedCode = this.suggestTemplateCodeByCountry(input.country);

    if (suggestedCode) {
      const suggested = await this.prisma.curriculumTemplate.findUnique({
        where: { code: suggestedCode },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      if (suggested) return suggested;
    }

    const generic =
      (await this.prisma.curriculumTemplate.findUnique({
        where: { code: "GENERIC" },
        select: {
          id: true,
          code: true,
          name: true,
        },
      })) ??
      (await this.prisma.curriculumTemplate.create({
        data: {
          code: "GENERIC",
          name: "General Program",
          description:
            "A flexible curriculum for institutions that want to configure their structure gradually.",
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      }));

    return generic;
  }

  private suggestTemplateCodeByCountry(country: string) {
    const normalized = country.trim().toLowerCase();

    const map: Record<string, string> = {
      kenya: "CBC",
      uganda: "UGANDA",
      tanzania: "TANZANIA",
      rwanda: "RWANDA",
      "south africa": "CAPS",
      ghana: "GHANA",
      nigeria: "NIGERIA",
      "united kingdom": "BRITISH",
      uk: "BRITISH",
      india: "CBSE",
      australia: "AUSTRALIA",
      "new zealand": "NEW_ZEALAND",
    };

    return map[normalized] ?? "GENERIC";
  }

  private defaultProgramNameForInstitutionType(
    institutionType: InstitutionType
  ) {
    const map: Record<InstitutionType, string> = {
      SCHOOL: "General Program",
      COLLEGE: "College Program",
      UNIVERSITY: "University Program",
      POLYTECHNIC: "Polytechnic Program",
      VOCATIONAL: "Vocational Program",
      TRAINING_CENTER: "Training Program",
      ACADEMY: "Academy Program",
      OTHER: "General Program",
    };

    return map[institutionType] ?? "General Program";
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private async generateUniqueSkuullyId(
    tx: PrismaService | any,
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
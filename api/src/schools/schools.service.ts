// src/schools/schools.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SchoolRole } from "@prisma/client";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

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
            organizationId: true,
            branchId: true,
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
            organizationId: true,
            branchId: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("You are not an active member of this school");
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
        organizationId: true,
        branchId: true,
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

    const existingActiveMembership = await this.prisma.schoolMembership.findFirst({
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
      throw new ConflictException("This user is already an active member of the school");
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

    const createdOrFoundUser = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash(password, 10);
        const skuullyId = await this.generateUniqueSkuullyId(tx, normalizedFullName);

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
    });

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
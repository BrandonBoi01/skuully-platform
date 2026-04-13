import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InstitutionJoinRequestStatus,
  InviteStatus,
  MembershipStatus,
  MembershipType,
} from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInstitutionById(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        country: {
          select: {
            code: true,
            name: true,
            flagEmoji: true,
          },
        },
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

    if (!institution) {
      throw new NotFoundException("Institution not found");
    }

    return institution;
  }

  async listMemberships(institutionId: string) {
    return this.prisma.membership.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            skuullyId: true,
          },
        },
        assignedRoles: {
          include: {
            role: true,
          },
        },
        departmentLinks: {
          include: {
            department: true,
          },
        },
      },
    });
  }

  async listJoinRequests(
    institutionId: string,
    query: {
      status?: InstitutionJoinRequestStatus;
      requestType?: string;
    }
  ) {
    return this.prisma.institutionJoinRequest.findMany({
      where: {
        institutionId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.requestType ? { requestType: query.requestType as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            skuullyId: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async reviewJoinRequest(
    institutionId: string,
    joinRequestId: string,
    dto: {
      status: InstitutionJoinRequestStatus;
      note?: string;
    },
    reviewedByUserId: string
  ) {
    if (
      dto.status !== InstitutionJoinRequestStatus.APPROVED &&
      dto.status !== InstitutionJoinRequestStatus.REJECTED
    ) {
      throw new BadRequestException(
        "Join request review status must be APPROVED or REJECTED"
      );
    }

    const joinRequest = await this.prisma.institutionJoinRequest.findFirst({
      where: {
        id: joinRequestId,
        institutionId,
      },
      select: {
        id: true,
        institutionId: true,
        userId: true,
        requestType: true,
        status: true,
      },
    });

    if (!joinRequest) {
      throw new NotFoundException("Join request not found");
    }

    if (joinRequest.status !== InstitutionJoinRequestStatus.PENDING) {
      throw new BadRequestException("Only pending join requests can be reviewed");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const reviewed = await tx.institutionJoinRequest.update({
        where: { id: joinRequest.id },
        data: {
          status: dto.status,
          note: dto.note?.trim() || null,
          reviewedAt: new Date(),
          reviewedByUserId,
        },
      });

      if (dto.status === InstitutionJoinRequestStatus.APPROVED) {
        const existingMembership = await tx.membership.findFirst({
          where: {
            institutionId,
            userId: joinRequest.userId,
          },
          select: {
            id: true,
            status: true,
          },
        });

        const mappedMembershipType = this.mapJoinRequestTypeToMembershipType(
          joinRequest.requestType
        );

        if (!existingMembership) {
          await tx.membership.create({
            data: {
              institutionId,
              userId: joinRequest.userId,
              membershipType: mappedMembershipType,
              status: MembershipStatus.ACTIVE,
              isPrimary: false,
              joinedAt: new Date(),
            },
          });
        } else if (existingMembership.status !== MembershipStatus.ACTIVE) {
          await tx.membership.update({
            where: { id: existingMembership.id },
            data: {
              membershipType: mappedMembershipType,
              status: MembershipStatus.ACTIVE,
              joinedAt: new Date(),
            },
          });
        }
      }

      return reviewed;
    });

    return {
      message:
        dto.status === InstitutionJoinRequestStatus.APPROVED
          ? "Join request approved successfully"
          : "Join request rejected successfully",
      joinRequest: updated,
    };
  }

  async createMembershipInvite(
    institutionId: string,
    dto: {
      email: string;
      membershipType: MembershipType;
      note?: string;
    },
    invitedByUserId: string
  ) {
    const email = dto.email.trim().toLowerCase();

    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true, name: true },
    });

    if (!institution) {
      throw new NotFoundException("Institution not found");
    }

    const existingPendingInvite = await this.prisma.membershipInvite.findFirst({
      where: {
        institutionId,
        email,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (existingPendingInvite) {
      throw new BadRequestException("A pending invite already exists for this email");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership = await this.prisma.membership.findFirst({
        where: {
          institutionId,
          userId: existingUser.id,
        },
        select: { id: true },
      });

      if (existingMembership) {
        throw new BadRequestException("This user already has a relationship with this institution");
      }
    }

    const code = this.generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.membershipInvite.create({
      data: {
        institutionId,
        email,
        membershipType: dto.membershipType,
        invitedByUserId,
        code,
        status: InviteStatus.PENDING,
        expiresAt,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: "Membership invite created successfully",
      invite,
      delivery: {
        code,
        expiresAt,
        note:
          dto.note?.trim() || null,
      },
    };
  }

  async listMembershipInvites(institutionId: string) {
    return this.prisma.membershipInvite.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      include: {
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async acceptMembershipInvite(userId: string, code: string) {
    const normalizedCode = code.trim();

    const invite = await this.prisma.membershipInvite.findUnique({
      where: { code: normalizedCode },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invite) {
      throw new BadRequestException("Invalid invite code");
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException("This invite is no longer active");
    }

    if (invite.expiresAt <= new Date()) {
      await this.prisma.membershipInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRED },
      });

      throw new BadRequestException("This invite has expired");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.email || user.email.trim().toLowerCase() !== invite.email) {
      throw new BadRequestException(
        "This invite can only be accepted by the invited email address"
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.membership.findFirst({
        where: {
          institutionId: invite.institutionId,
          userId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      let membershipId: string;

      if (!existingMembership) {
        const createdMembership = await tx.membership.create({
          data: {
            institutionId: invite.institutionId,
            userId,
            membershipType: invite.membershipType,
            status: MembershipStatus.ACTIVE,
            isPrimary: false,
            joinedAt: new Date(),
          },
          select: {
            id: true,
          },
        });

        membershipId = createdMembership.id;
      } else {
        await tx.membership.update({
          where: { id: existingMembership.id },
          data: {
            membershipType: invite.membershipType,
            status: MembershipStatus.ACTIVE,
            joinedAt: existingMembership.status === MembershipStatus.ACTIVE
              ? undefined
              : new Date(),
          },
        });

        membershipId = existingMembership.id;
      }

      await tx.membershipInvite.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.ACCEPTED,
        },
      });

      return { membershipId };
    });

    return {
      message: "Membership invite accepted successfully",
      institution: invite.institution,
      membershipId: result.membershipId,
    };
  }

  async createDepartment(
    institutionId: string,
    dto: {
      name: string;
      code?: string;
      description?: string;
      type?: any;
    }
  ) {
    const name = dto.name.trim();

    const existing = await this.prisma.department.findFirst({
      where: {
        institutionId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Department already exists");
    }

    return this.prisma.department.create({
      data: {
        institutionId,
        name,
        code: dto.code?.trim() || null,
        description: dto.description?.trim() || null,
        type: dto.type ?? null,
      },
    });
  }

  async listDepartments(institutionId: string) {
    return this.prisma.department.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
      include: {
        memberships: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async assignDepartment(
    institutionId: string,
    membershipId: string,
    departmentId: string
  ) {
    const [membership, department] = await Promise.all([
      this.prisma.membership.findFirst({
        where: {
          id: membershipId,
          institutionId,
        },
        select: { id: true },
      }),
      this.prisma.department.findFirst({
        where: {
          id: departmentId,
          institutionId,
        },
        select: { id: true },
      }),
    ]);

    if (!membership) {
      throw new NotFoundException("Membership not found");
    }

    if (!department) {
      throw new NotFoundException("Department not found");
    }

    return this.prisma.departmentMembership.upsert({
      where: {
        unique_department_membership: {
          departmentId,
          membershipId,
        },
      },
      create: {
        departmentId,
        membershipId,
      },
      update: {},
    });
  }

  async createRole(
    institutionId: string,
    dto: {
      name: string;
      key: string;
      description?: string;
      scope: any;
      departmentId?: string;
      permissions: string[];
    }
  ) {
    if (dto.scope === "DEPARTMENT" && !dto.departmentId) {
      throw new BadRequestException(
        "departmentId is required for department-scoped roles"
      );
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: dto.departmentId,
          institutionId,
        },
        select: { id: true },
      });

      if (!department) {
        throw new NotFoundException("Department not found");
      }
    }

    return this.prisma.accessRole.create({
      data: {
        institutionId,
        departmentId: dto.departmentId || null,
        name: dto.name.trim(),
        key: dto.key.trim().toUpperCase(),
        description: dto.description?.trim() || null,
        scope: dto.scope,
        permissions: {
          createMany: {
            data: dto.permissions.map((permission) => ({
              permission: permission.trim(),
            })),
          },
        },
      },
      include: {
        permissions: {
          orderBy: { permission: "asc" },
        },
      },
    });
  }

  async listRoles(institutionId: string) {
    return this.prisma.accessRole.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
      include: {
        department: true,
        permissions: {
          orderBy: { permission: "asc" },
        },
      },
    });
  }

  async assignRole(institutionId: string, membershipId: string, roleId: string) {
    const [membership, role] = await Promise.all([
      this.prisma.membership.findFirst({
        where: {
          id: membershipId,
          institutionId,
        },
        select: { id: true },
      }),
      this.prisma.accessRole.findFirst({
        where: {
          id: roleId,
          institutionId,
        },
        select: { id: true },
      }),
    ]);

    if (!membership) {
      throw new NotFoundException("Membership not found");
    }

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    return this.prisma.membershipAssignedRole.upsert({
      where: {
        unique_membership_role: {
          membershipId,
          roleId,
        },
      },
      create: {
        membershipId,
        roleId,
      },
      update: {},
    });
  }

  private mapJoinRequestTypeToMembershipType(requestType: string): MembershipType {
    switch (requestType) {
      case "STUDENT":
        return MembershipType.STUDENT;
      case "STAFF":
        return MembershipType.STAFF;
      case "PARENT":
        return MembershipType.PARENT;
      case "GUARDIAN":
        return MembershipType.GUARDIAN;
      case "PARTNER":
        return MembershipType.PARTNER;
      default:
        return MembershipType.VIEWER;
    }
  }

  private generateInviteCode() {
    return randomBytes(24).toString("hex");
  }
}
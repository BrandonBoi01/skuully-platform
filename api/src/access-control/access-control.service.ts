import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { MembershipStatus, MembershipType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembershipContext(input: {
    userId: string;
    institutionId: string;
  }) {
    return this.prisma.membership.findFirst({
      where: {
        userId: input.userId,
        institutionId: input.institutionId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        id: true,
        userId: true,
        institutionId: true,
        membershipType: true,
        status: true,
        assignedRoles: {
          select: {
            role: {
              select: {
                id: true,
                key: true,
                name: true,
                scope: true,
                isSystem: true,
                permissions: {
                  select: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        departmentLinks: {
          select: {
            departmentId: true,
          },
        },
      },
    });
  }

  async getMembershipPermissions(input: {
    userId: string;
    institutionId: string;
  }): Promise<string[]> {
    const membership = await this.getMembershipContext(input);

    if (!membership) {
      return [];
    }

    const permissionSet = new Set<string>();

    for (const assignment of membership.assignedRoles) {
      for (const permission of assignment.role.permissions) {
        permissionSet.add(permission.permission);
      }
    }

    if (
      membership.membershipType === MembershipType.OWNER ||
      membership.membershipType === MembershipType.ADMIN
    ) {
      permissionSet.add("*");
    }

    return Array.from(permissionSet);
  }

  async requirePermissions(input: {
    userId: string;
    institutionId: string;
    permissions: string[];
  }) {
    if (!input.userId) {
      throw new UnauthorizedException("Unauthorized");
    }

    const membership = await this.getMembershipContext({
      userId: input.userId,
      institutionId: input.institutionId,
    });

    if (!membership) {
      throw new ForbiddenException(
        "You do not have an active membership in this institution",
      );
    }

    const grantedPermissions = new Set<string>();

    for (const assignment of membership.assignedRoles) {
      for (const permission of assignment.role.permissions) {
        grantedPermissions.add(permission.permission);
      }
    }

    if (
      membership.membershipType === MembershipType.OWNER ||
      membership.membershipType === MembershipType.ADMIN
    ) {
      grantedPermissions.add("*");
    }

    const hasAllPermissions =
      grantedPermissions.has("*") ||
      input.permissions.every((permission) => grantedPermissions.has(permission));

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        "You do not have permission to perform this action",
      );
    }

    return {
      membershipId: membership.id,
      institutionId: membership.institutionId,
      membershipType: membership.membershipType,
      permissions: Array.from(grantedPermissions),
      departmentIds: membership.departmentLinks.map((item) => item.departmentId),
      roles: membership.assignedRoles.map((item) => ({
        id: item.role.id,
        key: item.role.key,
        name: item.role.name,
        scope: item.role.scope,
        isSystem: item.role.isSystem,
      })),
    };
  }
}
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DEFAULT_DEPARTMENTS } from "../../prisma/seeds/department-templates";
import { SYSTEM_ROLE_TEMPLATES } from "../../prisma/seeds/role-templates";

@Injectable()
export class InstitutionAccessSetupService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapInstitutionAccess(input: {
    institutionId: string;
    ownerMembershipId?: string | null;
  }) {
    const { institutionId, ownerMembershipId } = input;

    const departmentByType = new Map<string, string>();

    for (const template of DEFAULT_DEPARTMENTS) {
      const department = await this.prisma.department.upsert({
        where: {
          unique_department_name_per_institution: {
            institutionId,
            name: template.name,
          },
        },
        update: {
          code: template.code ?? null,
          type: template.type ?? null,
          description: template.description ?? null,
        },
        create: {
          institutionId,
          name: template.name,
          code: template.code ?? null,
          type: template.type ?? null,
          description: template.description ?? null,
        },
        select: {
          id: true,
          type: true,
        },
      });

      if (department.type) {
        departmentByType.set(department.type, department.id);
      }
    }

    for (const template of SYSTEM_ROLE_TEMPLATES) {
      const resolvedDepartmentId = template.departmentType
        ? (departmentByType.get(template.departmentType) ?? null)
        : null;

      const role = await this.prisma.accessRole.upsert({
        where: {
          unique_role_key_per_institution: {
            institutionId,
            key: template.key,
          },
        },
        update: {
          name: template.name,
          description: template.description ?? null,
          scope: template.scope,
          departmentId: resolvedDepartmentId,
          isSystem: true,
          isAssignable: template.isAssignable ?? true,
        },
        create: {
          institutionId,
          key: template.key,
          name: template.name,
          description: template.description ?? null,
          scope: template.scope,
          departmentId: resolvedDepartmentId,
          isSystem: true,
          isAssignable: template.isAssignable ?? true,
        },
        select: {
          id: true,
          key: true,
        },
      });

      await this.prisma.accessRolePermission.deleteMany({
        where: { roleId: role.id },
      });

      if (template.permissions.length) {
        await this.prisma.accessRolePermission.createMany({
          data: template.permissions.map((permission) => ({
            roleId: role.id,
            permission,
          })),
          skipDuplicates: true,
        });
      }

      if (ownerMembershipId && template.key === "OWNER") {
        await this.prisma.membershipAssignedRole.upsert({
          where: {
            unique_membership_role: {
              membershipId: ownerMembershipId,
              roleId: role.id,
            },
          },
          update: {},
          create: {
            membershipId: ownerMembershipId,
            roleId: role.id,
          },
        });
      }
    }
  }
}
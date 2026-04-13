import { DepartmentType, RoleScope } from "@prisma/client";
import { PERMISSIONS } from "../../src/access-control/permissions.constants";

export type RoleTemplate = {
  key: string;
  name: string;
  description?: string;
  scope: RoleScope;
  departmentType?: DepartmentType;
  permissions: string[];
  isAssignable?: boolean;
};

export const SYSTEM_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    key: "OWNER",
    name: "Owner",
    description: "Full institution control",
    scope: RoleScope.INSTITUTION,
    permissions: ["*"],
    isAssignable: true,
  },
  {
    key: "ADMIN",
    name: "Administrator",
    description: "Institution-wide administration access",
    scope: RoleScope.INSTITUTION,
    permissions: ["*"],
    isAssignable: true,
  },
  {
    key: "HR_MANAGER",
    name: "HR Manager",
    description: "Manages HR team operations",
    scope: RoleScope.DEPARTMENT,
    departmentType: DepartmentType.HR,
    permissions: [
      PERMISSIONS.MEMBERSHIP_VIEW,
      PERMISSIONS.MEMBERSHIP_ASSIGN,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.STAFF_CREATE,
      PERMISSIONS.STAFF_UPDATE,
      PERMISSIONS.DEPARTMENT_VIEW,
    ],
    isAssignable: true,
  },
  {
    key: "FINANCE_MANAGER",
    name: "Finance Manager",
    description: "Manages finance and billing operations",
    scope: RoleScope.DEPARTMENT,
    departmentType: DepartmentType.FINANCE,
    permissions: [
      PERMISSIONS.BILLING_VIEW,
      PERMISSIONS.BILLING_MANAGE,
      PERMISSIONS.MEMBERSHIP_VIEW,
      PERMISSIONS.DEPARTMENT_VIEW,
    ],
    isAssignable: true,
  },
  {
    key: "ACADEMICS_MANAGER",
    name: "Academics Manager",
    description: "Manages academic setup and student records",
    scope: RoleScope.DEPARTMENT,
    departmentType: DepartmentType.ACADEMICS,
    permissions: [
      PERMISSIONS.PROGRAM_VIEW,
      PERMISSIONS.PROGRAM_CREATE,
      PERMISSIONS.PROGRAM_UPDATE,
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.STUDENT_CREATE,
      PERMISSIONS.STUDENT_UPDATE,
      PERMISSIONS.STAFF_VIEW,
    ],
    isAssignable: true,
  },
  {
    key: "COMMUNICATIONS_MANAGER",
    name: "Communications Manager",
    description: "Manages announcements and communication channels",
    scope: RoleScope.DEPARTMENT,
    departmentType: DepartmentType.COMMUNICATIONS,
    permissions: [
      PERMISSIONS.COMMUNICATIONS_MANAGE,
      PERMISSIONS.INSTITUTION_VIEW,
    ],
    isAssignable: true,
  },
  {
    key: "MARKETING_MANAGER",
    name: "Marketing Manager",
    description: "Manages social and marketing operations",
    scope: RoleScope.DEPARTMENT,
    departmentType: DepartmentType.MARKETING,
    permissions: [
      PERMISSIONS.MARKETING_MANAGE,
      PERMISSIONS.SOCIAL_MANAGE,
      PERMISSIONS.INSTITUTION_VIEW,
    ],
    isAssignable: true,
  },
  {
    key: "DEPARTMENT_VIEWER",
    name: "Department Viewer",
    description: "Read-only department visibility",
    scope: RoleScope.DEPARTMENT,
    permissions: [
      PERMISSIONS.DEPARTMENT_VIEW,
      PERMISSIONS.MEMBERSHIP_VIEW,
    ],
    isAssignable: true,
  },
];
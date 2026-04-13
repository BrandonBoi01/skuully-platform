import { DepartmentType } from "@prisma/client";

export type DepartmentTemplate = {
  name: string;
  code: string;
  type: DepartmentType;
  description?: string;
};

export const DEFAULT_DEPARTMENTS: DepartmentTemplate[] = [
  {
    name: "Administration",
    code: "ADMIN",
    type: "ADMINISTRATION",
    description: "Institution administration and leadership",
  },
  {
    name: "Human Resources",
    code: "HR",
    type: "HR",
    description: "Staff recruitment, onboarding, and people operations",
  },
  {
    name: "Finance",
    code: "FIN",
    type: "FINANCE",
    description: "Billing, accounting, and institutional finance",
  },
  {
    name: "Academics",
    code: "ACA",
    type: "ACADEMICS",
    description: "Programs, curriculum, and academic operations",
  },
  {
    name: "Communications",
    code: "COMMS",
    type: "COMMUNICATIONS",
    description: "Internal and external communication",
  },
  {
    name: "Marketing",
    code: "MKT",
    type: "MARKETING",
    description: "Brand, outreach, social, and promotion",
  },
  {
    name: "IT",
    code: "IT",
    type: "IT",
    description: "Technical systems and support",
  },
  {
    name: "Transport",
    code: "TRANS",
    type: "TRANSPORT",
    description: "Transport and route operations",
  },
  {
    name: "Library",
    code: "LIB",
    type: "LIBRARY",
    description: "Library and learning resources",
  },
  {
    name: "Security",
    code: "SEC",
    type: "SECURITY",
    description: "Safety, access control, and incident management",
  },
];
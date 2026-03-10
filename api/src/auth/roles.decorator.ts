// src/auth/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { SchoolRole } from "@prisma/client";

export const ROLES_KEY = "roles";

export const Roles = (...roles: SchoolRole[]) => SetMetadata(ROLES_KEY, roles);
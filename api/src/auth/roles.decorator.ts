import { SetMetadata } from "@nestjs/common";
import { MembershipType } from "@prisma/client";

export const ROLES_KEY = "roles";

export const Roles = (...roles: MembershipType[]) =>
  SetMetadata(ROLES_KEY, roles);
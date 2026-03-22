import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MembershipType } from "@prisma/client";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<MembershipType[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user as {
      userId?: string;
      role?: MembershipType | null;
    };

    if (!user?.userId) {
      throw new ForbiddenException("Not authenticated.");
    }

    if (!user.role) {
      throw new ForbiddenException(
        "Missing school role. Switch to a school first."
      );
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Requires role: ${requiredRoles.join(" or ")}`
      );
    }

    return true;
  }
}
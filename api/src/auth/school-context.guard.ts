// src/auth/school-context.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SchoolRole } from "@prisma/client";

type RequestUser = {
  userId?: string;
  schoolId?: string | null;
  role?: SchoolRole | null;
  membershipId?: string | null;
};

@Injectable()
export class SchoolContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as RequestUser;

    if (!user?.userId) {
      throw new ForbiddenException("Not authenticated.");
    }

    if (!user.schoolId) {
      throw new ForbiddenException(
        "No active school. Use POST /schools/switch/:schoolId first."
      );
    }

    const membership = await this.prisma.schoolMembership.findUnique({
      where: {
        userId_schoolId: {
          userId: user.userId,
          schoolId: user.schoolId,
        },
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      throw new ForbiddenException(
        "No active school membership. Use POST /schools/switch/:schoolId first."
      );
    }

    req.user = {
      ...user,
      membershipId: membership.id,
      role: membership.role,
    };

    return true;
  }
}
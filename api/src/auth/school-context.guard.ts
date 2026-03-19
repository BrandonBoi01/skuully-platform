import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SchoolContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.userId) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!user?.schoolId) {
      throw new ForbiddenException("No active school selected");
    }

    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        userId: user.userId,
        schoolId: user.schoolId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "You are not an active member of this school"
      );
    }

    req.user.membershipId = membership.id;
    req.user.role = membership.role;

    return true;
  }
}
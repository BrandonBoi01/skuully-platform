// src/auth/program-context.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class ProgramContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as {
      userId?: string;
      schoolId?: string | null;
      programId?: string | null;
    };

    if (!user?.userId) {
      throw new ForbiddenException("Not authenticated.");
    }

    if (!user.schoolId) {
      throw new ForbiddenException(
        "No active school. Use POST /schools/switch/:schoolId first."
      );
    }

    if (!user.programId) {
      throw new ForbiddenException(
        "No active program. Use POST /programs/switch/:programId first."
      );
    }

    return true;
  }
}
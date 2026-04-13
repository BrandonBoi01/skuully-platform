import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "./permissions.decorator";
import { AccessControlService } from "./access-control.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControl: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (!requiredPermissions.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.userId) {
      throw new UnauthorizedException("Unauthorized");
    }

    const institutionId =
      req.params?.institutionId ??
      req.body?.institutionId ??
      req.query?.institutionId ??
      user.institutionId ??
      null;

    if (!institutionId || typeof institutionId !== "string") {
      throw new UnauthorizedException("Institution context is required");
    }

    const access = await this.accessControl.requirePermissions({
      userId: user.userId,
      institutionId,
      permissions: requiredPermissions,
    });

    req.access = access;

    return true;
  }
}
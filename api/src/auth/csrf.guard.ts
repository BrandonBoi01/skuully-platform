import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { CSRF_COOKIE_NAME, readCookieFromHeader } from "./auth-cookie.util";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    if (SAFE_METHODS.has(req.method)) {
      return true;
    }

    const csrfCookie =
      req.cookies?.[CSRF_COOKIE_NAME] ??
      readCookieFromHeader(req.headers?.cookie, CSRF_COOKIE_NAME);

    const csrfHeader = this.normalizeHeader(req.headers?.["x-csrf-token"]);

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException("Invalid CSRF token");
    }

    return true;
  }

  private normalizeHeader(value: unknown) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    return null;
  }
}
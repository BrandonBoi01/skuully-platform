import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { CSRF_COOKIE_NAME } from "./auth-cookie.util";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    if (SAFE_METHODS.has(req.method)) {
      return true;
    }

    const csrfCookie =
      req.cookies?.[CSRF_COOKIE_NAME] ?? this.readCookie(req.headers?.cookie);

    const csrfHeader = req.headers["x-csrf-token"];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException("Invalid CSRF token");
    }

    return true;
  }

  private readCookie(cookieHeader?: string) {
    if (!cookieHeader) return null;

    const parts = cookieHeader.split(";").map((item) => item.trim());
    const found = parts.find((item) => item.startsWith(`${CSRF_COOKIE_NAME}=`));

    if (!found) return null;
    return decodeURIComponent(found.slice(CSRF_COOKIE_NAME.length + 1));
  }
}
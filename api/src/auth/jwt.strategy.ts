import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";

import { ACCESS_COOKIE_NAME, readCookieFromHeader } from "./auth-cookie.util";

export type AuthenticatedRequestUser = {
  userId: string;
  membershipId: string | null;
  institutionId: string | null;
  membershipType: string | null;
  sessionId: string | null;
  type: string;
};

type JwtPayload = {
  sub: string;
  membershipId?: string | null;
  institutionId?: string | null;
  membershipType?: string | null;
  sid?: string | null;
  type?: string;
};

const accessCookieExtractor = (req: any) => {
  if (!req) return null;

  if (req.cookies?.[ACCESS_COOKIE_NAME]) {
    return req.cookies[ACCESS_COOKIE_NAME];
  }

  return readCookieFromHeader(req.headers?.cookie, ACCESS_COOKIE_NAME);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        accessCookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedRequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException("Invalid access token");
    }

    if (payload.type && payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }

    return {
      userId: payload.sub,
      membershipId: payload.membershipId ?? null,
      institutionId: payload.institutionId ?? null,
      membershipType: payload.membershipType ?? null,
      sessionId: payload.sid ?? null,
      type: payload.type ?? "access",
    };
  }
}
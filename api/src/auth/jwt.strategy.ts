import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { MembershipType } from "@prisma/client";
import { ACCESS_COOKIE_NAME } from "./auth-cookie.util";

interface JwtPayload {
  sub: string;
  schoolId?: string | null;
  programId?: string | null;
  role?: MembershipType | null;
  membershipId?: string | null;
  type?: string;
}

function extractCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const target = cookies.find((item) => item.startsWith(`${name}=`));

  if (!target) return null;

  return decodeURIComponent(target.slice(name.length + 1));
}

const accessCookieExtractor = (req: any) => {
  if (!req) return null;

  if (req.cookies?.[ACCESS_COOKIE_NAME]) {
    return req.cookies[ACCESS_COOKIE_NAME];
  }

  return extractCookieValue(req.headers?.cookie, ACCESS_COOKIE_NAME);
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

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      schoolId: payload.schoolId ?? null,
      programId: payload.programId ?? null,
      role: payload.role ?? null,
      membershipId: payload.membershipId ?? null,
    };
  }
}
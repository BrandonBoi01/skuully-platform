// src/auth/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { SchoolRole } from "@prisma/client";

interface JwtPayload {
  sub: string;
  schoolId?: string | null;
  programId?: string | null;
  role?: SchoolRole | null;
  membershipId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
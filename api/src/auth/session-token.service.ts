import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "crypto";
import type { StringValue } from "ms";

import { PrismaService } from "../prisma/prisma.service";

type SessionContext = {
  userId: string;
  institutionId?: string | null;
  membershipId?: string | null;
  membershipType?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class SessionTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async issueSession(input: SessionContext) {
    const accessToken = await this.signAccessToken({
      userId: input.userId,
      institutionId: input.institutionId ?? null,
      membershipId: input.membershipId ?? null,
      membershipType: input.membershipType ?? null,
    });

    const refreshToken = randomBytes(48).toString("hex");
    const csrfToken = randomBytes(24).toString("hex");

    const refreshTokenHash = this.hash(refreshToken);
    const csrfTokenHash = this.hash(csrfToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.refreshSession.create({
      data: {
        userId: input.userId,
        tokenHash: refreshTokenHash,
        csrfTokenHash,
        expiresAt,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        lastUsedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    return {
      accessToken,
      refreshToken,
      csrfToken,
      refreshSessionId: session.id,
    };
  }

  async rotateRefreshSession(input: {
    refreshToken: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const tokenHash = this.hash(input.refreshToken);

    const existing = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
      return null;
    }

    const accessToken = await this.signAccessToken({
      userId: existing.userId,
      institutionId: null,
      membershipId: null,
      membershipType: null,
    });

    const newRefreshToken = randomBytes(48).toString("hex");
    const newCsrfToken = randomBytes(24).toString("hex");

    const newRefreshTokenHash = this.hash(newRefreshToken);
    const newCsrfTokenHash = this.hash(newCsrfToken);

    const newSession = await this.prisma.refreshSession.create({
      data: {
        userId: existing.userId,
        tokenHash: newRefreshTokenHash,
        csrfTokenHash: newCsrfTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        lastUsedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    await this.prisma.refreshSession.update({
      where: { id: existing.id },
      data: {
        revokedAt: new Date(),
        replacedById: newSession.id,
        lastUsedAt: new Date(),
      },
    });

    return {
      userId: existing.userId,
      institutionId: null,
      membershipId: null,
      membershipType: null,
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken: newCsrfToken,
    };
  }

  async revokeRefreshSession(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);

    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeRefreshSessionById(userId: string, sessionId: string) {
    await this.prisma.refreshSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllOtherUserRefreshSessions(
    userId: string,
    currentSessionId?: string | null
  ) {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async listUserSessions(userId: string) {
    return this.prisma.refreshSession.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private async signAccessToken(input: {
    userId: string;
    institutionId?: string | null;
    membershipId?: string | null;
    membershipType?: string | null;
  }) {
    return this.jwt.signAsync(
      {
        sub: input.userId,
        institutionId: input.institutionId ?? null,
        membershipId: input.membershipId ?? null,
        membershipType: input.membershipType ?? null,
        type: "access",
      },
      {
        expiresIn: (this.config.get<string>("JWT_EXPIRES_IN") ||
          "15m") as StringValue,
        issuer: this.config.get<string>("JWT_ISSUER") || "skuully",
        audience: this.config.get<string>("JWT_AUDIENCE") || "skuully-api",
      }
    );
  }
}
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

type SessionContext = {
  userId: string;
  schoolId?: string | null;
  programId?: string | null;
  role?: string | null;
  membershipId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class SessionTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async issueSession(input: SessionContext) {
    const accessToken = await this.signAccessToken({
      userId: input.userId,
      schoolId: input.schoolId ?? null,
      programId: input.programId ?? null,
      role: input.role ?? null,
      membershipId: input.membershipId ?? null,
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
        schoolId: input.schoolId ?? null,
        programId: input.programId ?? null,
        role: input.role ?? null,
        membershipId: input.membershipId ?? null,
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
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
      return null;
    }

    const accessToken = await this.signAccessToken({
      userId: existing.userId,
      schoolId: existing.schoolId ?? null,
      programId: existing.programId ?? null,
      role: existing.role ?? null,
      membershipId: existing.membershipId ?? null,
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
        schoolId: existing.schoolId ?? null,
        programId: existing.programId ?? null,
        role: existing.role ?? null,
        membershipId: existing.membershipId ?? null,
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
      schoolId: existing.schoolId ?? null,
      programId: existing.programId ?? null,
      role: existing.role ?? null,
      membershipId: existing.membershipId ?? null,
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

  async revokeAllOtherUserRefreshSessions(userId: string, currentSessionId?: string | null) {
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

  async updateSessionContext(input: {
    refreshToken: string;
    schoolId?: string | null;
    programId?: string | null;
    role?: string | null;
    membershipId?: string | null;
  }) {
    const tokenHash = this.hash(input.refreshToken);

    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        schoolId: input.schoolId ?? null,
        programId: input.programId ?? null,
        role: input.role ?? null,
        membershipId: input.membershipId ?? null,
        lastUsedAt: new Date(),
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
        schoolId: true,
        programId: true,
        role: true,
        membershipId: true,
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
    schoolId?: string | null;
    programId?: string | null;
    role?: string | null;
    membershipId?: string | null;
  }) {
    return this.jwt.signAsync(
      {
        sub: input.userId,
        schoolId: input.schoolId ?? null,
        programId: input.programId ?? null,
        role: input.role ?? null,
        membershipId: input.membershipId ?? null,
        type: "access",
      },
      {
        expiresIn: "15m",
      }
    );
  }
}
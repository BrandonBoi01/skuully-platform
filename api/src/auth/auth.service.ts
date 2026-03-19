import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";

import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationCodeDto } from "./dto/resend-verification-code.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { EmailService } from "./email.service";
import { AuthAuditService } from "./auth-audit.service";
import { SessionTokenService } from "./session-token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
    private readonly authAudit: AuthAuditService,
    private readonly sessionTokens: SessionTokenService
  ) {}

  async register(dto: RegisterDto, req?: any) {
    const email = dto.email.trim().toLowerCase();
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      await this.authAudit.log({
        email,
        event: "register_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "email_in_use",
      });
      throw new BadRequestException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: email.split("@")[0],
        email,
        passwordHash,
        skuullyId: await this.generateUniqueSkuullyId(
          this.prisma,
          email.split("@")[0]
        ),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        skuullyId: true,
        emailVerifiedAt: true,
      },
    });

    const verificationCode = await this.createEmailVerificationCode(
      user.id,
      user.email
    );

    await this.emailService.sendVerificationCodeEmail({
      to: user.email,
      fullName: user.fullName,
      code: verificationCode,
    });

    const session = await this.sessionTokens.issueSession({
      userId: user.id,
      schoolId: null,
      programId: null,
      role: null,
      membershipId: null,
      ipAddress,
      userAgent,
    });

    await this.authAudit.log({
      userId: user.id,
      email: user.email,
      event: "register_success",
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      message: "Registration successful. Verify your email to continue.",
      requiresEmailVerification: true,
      emailVerified: false,
      user,
      session,
    };
  }

  async login(dto: LoginDto, req?: any) {
    const identifier = dto.identifier.trim().toLowerCase();
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { skuullyId: identifier },
          { phone: identifier },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        skuullyId: true,
        passwordHash: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
      },
    });

    if (!user) {
      await this.authAudit.log({
        email: identifier,
        event: "login_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "user_not_found",
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.authAudit.log({
        userId: user.id,
        email: user.email,
        event: "login_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "invalid_password",
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const latestMembership = await this.prisma.schoolMembership.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    });

    const session = await this.sessionTokens.issueSession({
      userId: user.id,
      schoolId: latestMembership?.schoolId ?? null,
      programId: null,
      role: latestMembership?.role ?? null,
      membershipId: latestMembership?.id ?? null,
      ipAddress,
      userAgent,
    });

    await this.authAudit.log({
      userId: user.id,
      email: user.email,
      event: "login_success",
      ipAddress,
      userAgent,
      success: true,
      meta: {
        emailVerified: !!user.emailVerifiedAt,
        phoneVerified: !!user.phoneVerifiedAt,
        loginIdentifier: identifier,
      },
    });

    return {
      requiresEmailVerification: !user.emailVerifiedAt,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        skuullyId: user.skuullyId,
        phone: user.phone,
      },
      session,
    };
  }

  async verifyEmail(dto: VerifyEmailDto, req?: any) {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      await this.authAudit.log({
        email,
        event: "verify_email_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "user_not_found",
      });
      throw new BadRequestException("Invalid verification request");
    }

    if (user.emailVerifiedAt) {
      return {
        message: "Email already verified",
        emailVerified: true,
      };
    }

    const record = await this.prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        email,
        code,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!record) {
      await this.authAudit.log({
        userId: user.id,
        email: user.email,
        event: "verify_email_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "invalid_or_expired_code",
      });
      throw new BadRequestException("Invalid or expired verification code");
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
        },
      }),
    ]);

    await this.emailService.sendWelcomeEmail({
      to: user.email,
      fullName: user.fullName,
    });

    await this.authAudit.log({
      userId: user.id,
      email: user.email,
      event: "verify_email_success",
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      message: "Email verified successfully",
      emailVerified: true,
    };
  }

  async resendVerificationCode(dto: ResendVerificationCodeDto, req?: any) {
    const email = dto.email.trim().toLowerCase();
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      await this.authAudit.log({
        email,
        event: "resend_verification_neutral",
        ipAddress,
        userAgent,
        success: true,
        reason: "user_not_found_hidden",
      });

      return {
        message: "If that account exists, a verification code has been sent.",
      };
    }

    if (user.emailVerifiedAt) {
      return {
        message: "Email is already verified.",
        emailVerified: true,
      };
    }

    const verificationCode = await this.createEmailVerificationCode(
      user.id,
      user.email
    );

    await this.emailService.sendVerificationCodeEmail({
      to: user.email,
      fullName: user.fullName,
      code: verificationCode,
    });

    await this.authAudit.log({
      userId: user.id,
      email: user.email,
      event: "resend_verification_success",
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      message: "Verification code sent",
      emailVerified: false,
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto, req?: any) {
    const email = dto.email.trim().toLowerCase();
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      await this.authAudit.log({
        email,
        event: "forgot_password_neutral",
        ipAddress,
        userAgent,
        success: true,
        reason: "user_not_found_hidden",
      });

      return {
        message: "If that account exists, a reset link has been sent.",
      };
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl,
    });

    await this.authAudit.log({
      userId: user.id,
      email: user.email,
      event: "forgot_password_success",
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      message: "If that account exists, a reset link has been sent.",
    };
  }

  async resetPassword(dto: ResetPasswordDto, req?: any) {
    const rawToken = dto.token.trim();
    const tokenHash = this.hashToken(rawToken);
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      await this.authAudit.log({
        event: "reset_password_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "invalid_or_expired_token",
      });
      throw new BadRequestException("This reset link is invalid or has expired");
    }

    const isSamePassword = await bcrypt.compare(
      dto.password,
      record.user.passwordHash
    );

    if (isSamePassword) {
      await this.authAudit.log({
        userId: record.user.id,
        email: record.user.email,
        event: "reset_password_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "same_as_current_password",
      });
      throw new BadRequestException(
        "Choose a new password that is different from your current password"
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          usedAt: null,
          id: { not: record.id },
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    await this.emailService.sendPasswordChangedEmail({
      to: record.user.email,
      fullName: record.user.fullName,
    });

    await this.authAudit.log({
      userId: record.user.id,
      email: record.user.email,
      event: "reset_password_success",
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      message: "Password updated successfully",
    };
  }

  async refreshSession(refreshToken: string | null, req?: any) {
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const rotated = await this.sessionTokens.rotateRefreshSession({
      refreshToken,
      ipAddress,
      userAgent,
    });

    if (!rotated) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return rotated;
  }

  async logout(req?: any) {
    const refreshToken = req?.cookies?.skuully_refresh_token ?? null;

    if (refreshToken) {
      await this.sessionTokens.revokeRefreshSession(refreshToken);
    }
  }

  async listSessions(userId: string) {
    return this.sessionTokens.listUserSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.sessionTokens.revokeRefreshSessionById(userId, sessionId);
  }

  async revokeOtherSessions(userId: string, refreshToken: string | null) {
    let currentSessionId: string | null = null;

    if (refreshToken) {
      const tokenHash = this.sessionTokens.hash(refreshToken);

      const current = await this.prisma.refreshSession.findUnique({
        where: { tokenHash },
        select: { id: true },
      });

      currentSessionId = current?.id ?? null;
    }

    await this.sessionTokens.revokeAllOtherUserRefreshSessions(
      userId,
      currentSessionId
    );
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        skuullyId: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
        memberships: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: {
            role: true,
            status: true,
            createdAt: true,
            school: {
              select: {
                id: true,
                name: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      ...user,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
    };
  }

  private async createEmailVerificationCode(userId: string, email: string) {
    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailVerificationCode.create({
      data: {
        userId,
        email,
        code,
        purpose: "EMAIL_VERIFY",
        expiresAt,
      },
    });

    return code;
  }

  private hashToken(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private extractRequestMeta(req?: any) {
    const forwardedFor = req?.headers?.["x-forwarded-for"];
    const ipAddress =
      typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0].trim()
        : req?.ip || req?.socket?.remoteAddress || null;

    const userAgent = req?.headers?.["user-agent"] || null;

    return {
      ipAddress,
      userAgent,
    };
  }

  private async generateUniqueSkuullyId(
    tx: Prisma.TransactionClient | PrismaService,
    fullName: string
  ): Promise<string> {
    const base =
      fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s.]/g, "")
        .replace(/\s+/g, ".")
        .replace(/\.+/g, ".")
        .replace(/^\.|\.$/g, "") || "user";

    for (let i = 0; i < 10; i++) {
      const suffix = randomBytes(2).toString("hex");
      const candidate = `${base}.${suffix}`;

      const exists = await tx.user.findUnique({
        where: { skuullyId: candidate },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }
    }

    throw new BadRequestException("Could not generate unique skuullyId");
  }
}
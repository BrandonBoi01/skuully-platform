import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  AuthProvider,
  LoginMethod,
  Prisma,
  VerificationPurpose,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationCodeDto } from "./dto/resend-verification-code.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SocialAuthDto } from "./dto/social-auth.dto";
import { EmailService } from "./email.service";
import { AuthAuditService } from "./auth-audit.service";
import { SessionTokenService } from "./session-token.service";

type SafeUser = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  skuullyId: string;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
};

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();
  private readonly appleJwks = createRemoteJWKSet(
    new URL("https://appleid.apple.com/auth/keys")
  );

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
    const fullName = this.normalizeFullName(dto.fullName);
    const { firstName, lastName } = this.splitName(fullName);
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
        fullName,
        firstName,
        lastName,
        email,
        passwordHash,
        preferredLoginMethod: LoginMethod.EMAIL,
        skuullyId: await this.generateUniqueSkuullyId(this.prisma, fullName),
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        skuullyId: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
      },
    });

    const verificationCode = await this.createEmailVerificationCode(
      user.id,
      user.email
    );

    try {
      await this.emailService.sendVerificationCodeEmail({
        to: user.email,
        fullName: user.fullName,
        code: verificationCode,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }

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
      phoneVerified: !!user.phoneVerifiedAt,
      user,
      session,
    };
  }

  async login(dto: LoginDto, req?: any) {
    const rawIdentifier = dto.identifier.trim();
    const loweredIdentifier = rawIdentifier.toLowerCase();
    const normalizedPhone = this.normalizeLoginPhone(rawIdentifier);
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: loweredIdentifier },
          { skuullyId: loweredIdentifier },
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
          { phone: loweredIdentifier },
        ],
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        skuullyId: true,
        passwordHash: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        authProviderAccounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      await this.authAudit.log({
        email: loweredIdentifier,
        event: "login_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "user_not_found",
      });

      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.passwordHash) {
      const providerLabels = user.authProviderAccounts.map((item) =>
        item.provider === "GOOGLE" ? "Google" : "Apple"
      );

      await this.authAudit.log({
        userId: user.id,
        email: user.email,
        event: "login_failed",
        ipAddress,
        userAgent,
        success: false,
        reason: "password_login_not_available",
      });

      throw new UnauthorizedException(
        providerLabels.length
          ? `This account uses ${providerLabels.join(" / ")} sign-in. Continue with your provider.`
          : "This account does not have password login enabled."
      );
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordOk) {
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
        loginIdentifier: rawIdentifier,
        emailVerified: !!user.emailVerifiedAt,
        phoneVerified: !!user.phoneVerifiedAt,
      },
    });

    return {
      requiresEmailVerification: !user.emailVerifiedAt,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        skuullyId: user.skuullyId,
      },
      session,
    };
  }

  async googleSocialAuth(dto: SocialAuthDto, req?: any) {
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const googleProfile = await this.verifyGoogleIdToken(dto.idToken);
    const fullName =
      this.normalizeOptionalFullName(dto.fullName) ??
      this.normalizeOptionalFullName(googleProfile.name) ??
      "Skuully User";

    return this.handleSocialLogin(
      {
        provider: AuthProvider.GOOGLE,
        providerUserId: googleProfile.sub,
        email: googleProfile.email,
        emailVerified: googleProfile.emailVerified,
        fullName,
        avatarUrl: googleProfile.picture ?? null,
      },
      { ipAddress, userAgent }
    );
  }

  async appleSocialAuth(dto: SocialAuthDto, req?: any) {
    const { ipAddress, userAgent } = this.extractRequestMeta(req);

    const appleProfile = await this.verifyAppleIdToken(dto.idToken);
    const fullName =
      this.normalizeOptionalFullName(dto.fullName) ??
      this.normalizeOptionalFullName(appleProfile.name) ??
      this.nameFromEmail(appleProfile.email) ??
      "Skuully User";

    return this.handleSocialLogin(
      {
        provider: AuthProvider.APPLE,
        providerUserId: appleProfile.sub,
        email: appleProfile.email,
        emailVerified: appleProfile.emailVerified,
        fullName,
        avatarUrl: null,
      },
      { ipAddress, userAgent }
    );
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
        firstName: true,
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
        purpose: VerificationPurpose.EMAIL_VERIFY,
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

    try {
      await this.emailService.sendWelcomeEmail({
        to: user.email,
        fullName: user.fullName,
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

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
        firstName: true,
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

    try {
      await this.emailService.sendVerificationCodeEmail({
        to: user.email,
        fullName: user.fullName,
        code: verificationCode,
      });
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    }

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
        firstName: true,
        passwordHash: true,
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

    if (!user.passwordHash) {
      return {
        message: "This account uses social sign-in. Continue with Google or Apple.",
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

    try {
      await this.emailService.sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }

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
            firstName: true,
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

    if (!record.user.passwordHash) {
      throw new BadRequestException(
        "This account uses social sign-in and does not have a password yet"
      );
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

    try {
      await this.emailService.sendPasswordChangedEmail({
        to: record.user.email,
        fullName: record.user.fullName,
      });
    } catch (error) {
      console.error("Failed to send password changed email:", error);
    }

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
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        skuullyId: true,
        preferredLoginMethod: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
        authProviderAccounts: {
          select: {
            provider: true,
          },
        },
        memberships: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
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
      providers: user.authProviderAccounts.map((item) => item.provider),
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
    };
  }

  private async handleSocialLogin(
    input: {
      provider: AuthProvider;
      providerUserId: string;
      email: string;
      emailVerified: boolean;
      fullName: string;
      avatarUrl: string | null;
    },
    meta: {
      ipAddress: string | null;
      userAgent: string | null;
    }
  ) {
    const email = input.email.trim().toLowerCase();

    if (!email) {
      throw new BadRequestException("A verified email is required");
    }

    const providerAccount = await this.prisma.authProviderAccount.findUnique({
      where: {
        unique_provider_provider_user: {
          provider: input.provider,
          providerUserId: input.providerUserId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            skuullyId: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        },
      },
    });

    let user: SafeUser;
    let isNewUser = false;

    if (providerAccount) {
      user = providerAccount.user;
    } else {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          skuullyId: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
        },
      });

      if (existingByEmail) {
        await this.prisma.authProviderAccount.create({
          data: {
            userId: existingByEmail.id,
            provider: input.provider,
            providerUserId: input.providerUserId,
            email,
          },
        });

        await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            preferredLoginMethod:
              input.provider === AuthProvider.GOOGLE
                ? LoginMethod.GOOGLE
                : LoginMethod.APPLE,
            emailVerifiedAt:
              input.emailVerified && !existingByEmail.emailVerifiedAt
                ? new Date()
                : existingByEmail.emailVerifiedAt ?? undefined,
            avatarUrl: input.avatarUrl ?? undefined,
          },
        });

        user = {
          ...existingByEmail,
          emailVerifiedAt:
            existingByEmail.emailVerifiedAt ?? (input.emailVerified ? new Date() : null),
        };
      } else {
        const { firstName, lastName } = this.splitName(
          this.normalizeFullName(input.fullName)
        );

        user = await this.prisma.user.create({
          data: {
            fullName: this.normalizeFullName(input.fullName),
            firstName,
            lastName,
            email,
            passwordHash: null,
            avatarUrl: input.avatarUrl,
            emailVerifiedAt: input.emailVerified ? new Date() : null,
            preferredLoginMethod:
              input.provider === AuthProvider.GOOGLE
                ? LoginMethod.GOOGLE
                : LoginMethod.APPLE,
            skuullyId: await this.generateUniqueSkuullyId(
              this.prisma,
              input.fullName
            ),
            authProviderAccounts: {
              create: {
                provider: input.provider,
                providerUserId: input.providerUserId,
                email,
              },
            },
          },
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            skuullyId: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        });

        isNewUser = true;
      }
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
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await this.authAudit.log({
      userId: user.id,
      email: user.email,
      event:
        input.provider === AuthProvider.GOOGLE
          ? "google_login_success"
          : "apple_login_success",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      success: true,
      meta: {
        provider: input.provider,
        linkedByEmail: !providerAccount,
        isNewUser,
      },
    });

    return {
      message: "Signed in successfully",
      requiresEmailVerification: false,
      emailVerified: true,
      isNewUser,
      user: {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        skuullyId: user.skuullyId,
      },
      session,
    };
  }

  private async verifyGoogleIdToken(idToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

    if (!clientId) {
      throw new BadRequestException("GOOGLE_CLIENT_ID is not configured");
    }

    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch {
      throw new UnauthorizedException("Invalid Google token");
    }

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException("Invalid Google account data");
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: !!payload.email_verified,
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    };
  }

  private async verifyAppleIdToken(idToken: string) {
    const appleClientId = process.env.APPLE_CLIENT_ID?.trim();

    if (!appleClientId) {
      throw new BadRequestException("APPLE_CLIENT_ID is not configured");
    }

    let verified;
    try {
      verified = await jwtVerify(idToken, this.appleJwks, {
        issuer: "https://appleid.apple.com",
        audience: appleClientId,
      });
    } catch {
      throw new UnauthorizedException("Invalid Apple token");
    }

    const payload = verified.payload;

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const emailVerifiedRaw =
      typeof payload.email_verified === "string"
        ? payload.email_verified
        : payload.email_verified === true
        ? "true"
        : "false";

    if (!sub || !email) {
      throw new UnauthorizedException("Invalid Apple account data");
    }

    return {
      sub,
      email: email.toLowerCase(),
      emailVerified: emailVerifiedRaw === "true",
      name: null,
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
        purpose: VerificationPurpose.EMAIL_VERIFY,
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

  private normalizeLoginPhone(value: string) {
    const raw = value.trim();
    if (!raw) return null;

    if (raw.startsWith("+")) {
      const digits = raw.slice(1).replace(/\D/g, "");
      return digits ? `+${digits}` : null;
    }

    const digits = raw.replace(/\D/g, "");
    return digits || null;
  }

  private normalizeFullName(value: string) {
    const fullName = value.replace(/\s+/g, " ").trim();

    if (fullName.length < 2) {
      throw new BadRequestException("Full name is required");
    }

    return fullName;
  }

  private normalizeOptionalFullName(value?: string | null) {
    if (!value) return null;
    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized.length >= 2 ? normalized : null;
  }

  private splitName(fullName: string) {
    const parts = fullName.split(" ").filter(Boolean);
    const firstName = parts[0] ?? fullName;
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

    return { firstName, lastName };
  }

  private nameFromEmail(email?: string | null) {
    if (!email) return null;

    const localPart = email.split("@")[0] || "user";
    const normalized = localPart
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return normalized.length >= 2 ? normalized : null;
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
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CsrfGuard } from "./csrf.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationCodeDto } from "./dto/resend-verification-code.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SocialAuthDto } from "./dto/social-auth.dto";
import {
  clearAuthCookies,
  setAccessCookie,
  setCsrfCookie,
  setRefreshCookie,
  REFRESH_COOKIE_NAME,
} from "./auth-cookie.util";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.register(dto, req);

    setAccessCookie(res, result.session.accessToken);
    setRefreshCookie(res, result.session.refreshToken);
    setCsrfCookie(res, result.session.csrfToken);

    return {
      message: result.message,
      requiresEmailVerification: result.requiresEmailVerification,
      emailVerified: result.emailVerified,
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.login(dto, req);

    setAccessCookie(res, result.session.accessToken);
    setRefreshCookie(res, result.session.refreshToken);
    setCsrfCookie(res, result.session.csrfToken);

    return {
      requiresEmailVerification: result.requiresEmailVerification,
      emailVerified: result.emailVerified,
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("social/google")
  async googleSocialAuth(
    @Body() dto: SocialAuthDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.googleSocialAuth(dto, req);

    setAccessCookie(res, result.session.accessToken);
    setRefreshCookie(res, result.session.refreshToken);
    setCsrfCookie(res, result.session.csrfToken);

    return {
      message: result.message,
      requiresEmailVerification: result.requiresEmailVerification,
      emailVerified: result.emailVerified,
      isNewUser: result.isNewUser,
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("social/apple")
  async appleSocialAuth(
    @Body() dto: SocialAuthDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.appleSocialAuth(dto, req);

    setAccessCookie(res, result.session.accessToken);
    setRefreshCookie(res, result.session.refreshToken);
    setCsrfCookie(res, result.session.csrfToken);

    return {
      message: result.message,
      requiresEmailVerification: result.requiresEmailVerification,
      emailVerified: result.emailVerified,
      isNewUser: result.isNewUser,
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("refresh")
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] ??
      this.readRefreshCookie(req.headers?.cookie);

    const result = await this.auth.refreshSession(refreshToken, req);

    setAccessCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    setCsrfCookie(res, result.csrfToken);

    return { ok: true };
  }

  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: any) {
    return this.auth.verifyEmail(dto, req);
  }

  @Throttle({ default: { limit: 3, ttl: 10 * 60_000 } })
  @Post("resend-verification-code")
  resendVerificationCode(
    @Body() dto: ResendVerificationCodeDto,
    @Req() req: any
  ) {
    return this.auth.resendVerificationCode(dto, req);
  }

  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  @Post("forgot-password")
  requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
    @Req() req: any
  ) {
    return this.auth.requestPasswordReset(dto, req);
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: any) {
    return this.auth.resetPassword(dto, req);
  }

  @UseGuards(JwtAuthGuard, CsrfGuard)
  @Post("logout")
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req);
    clearAuthCookies(res);
    return {
      message: "Logged out successfully",
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    const user = await this.auth.getMe(req.user.userId);

    return {
      ...user,
      context: {
        schoolId: req.user.schoolId ?? null,
        programId: req.user.programId ?? null,
        role: req.user.role ?? null,
        membershipId: req.user.membershipId ?? null,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  async sessions(@Req() req: any) {
    return this.auth.listSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, CsrfGuard)
  @Post("sessions/revoke-others")
  async revokeOtherSessions(@Req() req: any) {
    const refreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] ??
      this.readRefreshCookie(req.headers?.cookie);

    await this.auth.revokeOtherSessions(req.user.userId, refreshToken);

    return {
      message: "Other sessions revoked",
    };
  }

  @UseGuards(JwtAuthGuard, CsrfGuard)
  @Post("sessions/:sessionId/revoke")
  async revokeSession(
    @Req() req: any,
    @Param("sessionId") sessionId: string
  ) {
    await this.auth.revokeSession(req.user.userId, sessionId);

    return {
      message: "Session revoked",
    };
  }

  private readRefreshCookie(cookieHeader?: string) {
    if (!cookieHeader) return null;
    const parts = cookieHeader.split(";").map((item: string) => item.trim());
    const found = parts.find((item: string) =>
      item.startsWith(`${REFRESH_COOKIE_NAME}=`)
    );
    if (!found) return null;
    return decodeURIComponent(found.slice(REFRESH_COOKIE_NAME.length + 1));
  }
}
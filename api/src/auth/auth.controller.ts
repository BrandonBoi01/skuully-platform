// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
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
}
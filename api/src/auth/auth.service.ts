import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, SchoolRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "crypto";

import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationCodeDto } from "./dto/resend-verification-code.dto";
import { EmailService } from "./email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const schoolName = dto.schoolName.trim();
    const country = dto.country?.trim() || "Kenya";

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new BadRequestException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const skuullyId = await this.generateUniqueSkuullyId(tx, fullName);

      const user = await tx.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          skuullyId,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          skuullyId: true,
          emailVerifiedAt: true,
        },
      });

      const school = await tx.school.create({
        data: {
          name: schoolName,
          country,
        },
        select: {
          id: true,
          name: true,
          country: true,
        },
      });

      await tx.schoolMembership.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          role: SchoolRole.OWNER,
          status: "ACTIVE",
        },
      });

      const genericTemplate =
        (await tx.curriculumTemplate.findUnique({
          where: { code: "GENERIC" },
          select: { id: true, code: true, name: true },
        })) ??
        (await tx.curriculumTemplate.create({
          data: {
            code: "GENERIC",
            name: "Generic Curriculum",
            description:
              "A flexible curriculum for any school. You can install a specific template later.",
          },
          select: { id: true, code: true, name: true },
        }));

      const program = await tx.schoolProgram.create({
        data: {
          schoolId: school.id,
          templateId: genericTemplate.id,
          name: "General Program",
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          status: true,
          template: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      return { user, school, program };
    });

    const verificationCode = await this.createEmailVerificationCode(result.user.id);
    await this.emailService.sendVerificationCodeEmail({
      to: result.user.email,
      fullName: result.user.fullName,
      code: verificationCode,
    });

    const token = await this.jwt.signAsync({ sub: result.user.id });

    return {
      message: "Registration successful. Verify your email to continue.",
      token,
      requiresEmailVerification: true,
      emailVerified: false,
      user: result.user,
      school: result.school,
      program: result.program,
      next: [
        `POST /schools/switch/${result.school.id}`,
        `POST /programs/switch/${result.program.id}`,
      ],
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = await this.jwt.signAsync({ sub: user.id });

    return {
      token,
      requiresEmailVerification: !user.emailVerifiedAt,
      emailVerified: !!user.emailVerifiedAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        skuullyId: user.skuullyId,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

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

    await this.emailService.sendSecurityEventEmail({
      to: user.email,
      fullName: user.fullName,
      title: "Email verified",
      details: [
        "Your Skuully account email was successfully verified.",
        `Time: ${new Date().toISOString()}`,
      ],
    });

    return {
      message: "Email verified successfully",
      emailVerified: true,
    };
  }

  async resendVerificationCode(dto: ResendVerificationCodeDto) {
    const email = dto.email.trim().toLowerCase();

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

    const verificationCode = await this.createEmailVerificationCode(user.id);

    await this.emailService.sendVerificationCodeEmail({
      to: user.email,
      fullName: user.fullName,
      code: verificationCode,
    });

    return {
      message: "Verification code sent",
      emailVerified: false,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        skuullyId: true,
        emailVerifiedAt: true,
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
    };
  }

  private async createEmailVerificationCode(userId: string) {
    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailVerificationCode.create({
      data: {
        userId,
        code,
        expiresAt,
      },
    });

    return code;
  }

  private async generateUniqueSkuullyId(
    tx: Prisma.TransactionClient,
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
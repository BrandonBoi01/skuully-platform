import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

type LogAuthEventInput = {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  event: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  reason?: string | null;
  meta?: Prisma.InputJsonValue | null;
};

@Injectable()
export class AuthAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogAuthEventInput) {
    try {
      await this.prisma.authAuditLog.create({
        data: {
          userId: input.userId ?? null,
          email: input.email?.trim().toLowerCase() ?? null,
          phone: input.phone?.trim() ?? null,
          event: input.event,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          success: input.success ?? false,
          reason: input.reason ?? null,
          metaJson: input.meta ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      console.error("AUTH AUDIT LOG FAILED:", error);
    }
  }
}
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { EmailService } from "./email.service";
import { AuthAuditService } from "./auth-audit.service";
import { SessionTokenService } from "./session-token.service";
import { CsrfGuard } from "./csrf.guard";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: (config.get<string>("JWT_EXPIRES_IN") || "15m") as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    EmailService,
    AuthAuditService,
    SessionTokenService,
    CsrfGuard,
  ],
  exports: [AuthService, JwtModule, SessionTokenService, CsrfGuard],
})
export class AuthModule {}
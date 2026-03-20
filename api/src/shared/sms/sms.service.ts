import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendVerificationCode(input: { to: string; code: string }) {
    this.logger.log(
      `[SMS MOCK] Sending verification code ${input.code} to ${input.to}`
    );

    return {
      success: true,
      provider: "mock",
    };
  }
}
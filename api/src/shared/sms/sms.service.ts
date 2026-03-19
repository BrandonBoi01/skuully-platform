import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendVerificationCode(input: { to: string; code: string }) {
    if (process.env.NODE_ENV !== "production") {
      this.logger.debug(`[DEV SMS] Send code ${input.code} to ${input.to}`);
      return {
        success: true,
        provider: "dev-console",
      };
    }

    // Plug real provider later: Twilio / Africa's Talking / Termii / Infobip
    this.logger.log(`SMS provider not configured. Intended recipient: ${input.to}`);

    return {
      success: true,
      provider: "placeholder",
    };
  }
}
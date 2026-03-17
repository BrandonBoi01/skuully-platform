import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly replyTo?: string;
  private readonly appName: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim();
    this.from =
      this.config.get<string>("EMAIL_FROM")?.trim() ||
      "Skuully <no-reply@auth.skuully.app>";
    this.replyTo =
      this.config.get<string>("EMAIL_REPLY_TO")?.trim() || undefined;
    this.appName = this.config.get<string>("APP_NAME")?.trim() || "Skuully";
    this.appUrl = this.config.get<string>("APP_URL")?.trim() || "http://localhost:3001";

    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!apiKey) {
      this.logger.warn(
        "RESEND_API_KEY is not set. Emails will be logged but not sent."
      );
    }
  }

  async sendVerificationCodeEmail(input: {
    to: string;
    fullName: string;
    code: string;
  }) {
    const subject = `Verify your ${this.appName} email`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#070b1d;color:#fff;padding:24px">
        <div style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px">
          <p style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#84a4ff;margin:0 0 16px">Skuully Verification</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Confirm your email</h1>
          <p style="margin:0 0 20px;color:rgba(255,255,255,0.72)">
            Hi ${this.escapeHtml(input.fullName)}, use the verification code below to activate your account.
          </p>
          <div style="font-size:32px;font-weight:700;letter-spacing:0.35em;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px 20px;text-align:center;margin:0 0 16px">
            ${this.escapeHtml(input.code)}
          </div>
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.64)">This code expires in 10 minutes.</p>
          <p style="margin:0;color:rgba(255,255,255,0.48)">If you did not request this, you can ignore this email.</p>
        </div>
      </div>
    `;

    const text = [
      `Verify your ${this.appName} email`,
      ``,
      `Hi ${input.fullName},`,
      `Your verification code is: ${input.code}`,
      `This code expires in 10 minutes.`,
      `If you did not request this, you can ignore this email.`,
    ].join("\n");

    await this.send({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(input: {
    to: string;
    fullName: string;
  }) {
    const subject = `Welcome to ${this.appName}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#070b1d;color:#fff;padding:24px">
        <div style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px">
          <p style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#84a4ff;margin:0 0 16px">Welcome</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Your account is ready</h1>
          <p style="margin:0 0 20px;color:rgba(255,255,255,0.72)">
            Hi ${this.escapeHtml(input.fullName)}, your email has been verified and your ${this.appName} account is now active.
          </p>
          <a href="${this.escapeHtml(
            this.appUrl
          )}" style="display:inline-block;background:#3661E1;color:#fff;text-decoration:none;padding:12px 18px;border-radius:14px;font-weight:600">
            Open ${this.appName}
          </a>
        </div>
      </div>
    `;

    const text = [
      `Welcome to ${this.appName}`,
      ``,
      `Hi ${input.fullName},`,
      `Your email has been verified and your account is now active.`,
      `Open ${this.appUrl}`,
    ].join("\n");

    await this.send({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  async sendSecurityEventEmail(input: {
    to: string;
    fullName: string;
    title: string;
    details: string[];
  }) {
    const subject = `${this.appName} security notice: ${input.title}`;
    const detailsHtml = input.details
      .map(
        (item) =>
          `<li style="margin:0 0 8px;color:rgba(255,255,255,0.72)">${this.escapeHtml(
            item
          )}</li>`
      )
      .join("");

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#070b1d;color:#fff;padding:24px">
        <div style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px">
          <p style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#f0b7df;margin:0 0 16px">Security Notice</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">${this.escapeHtml(
            input.title
          )}</h1>
          <p style="margin:0 0 16px;color:rgba(255,255,255,0.72)">Hi ${this.escapeHtml(
            input.fullName
          )}, here is an important security event on your account.</p>
          <ul style="padding-left:18px;margin:0 0 18px">${detailsHtml}</ul>
          <p style="margin:0;color:rgba(255,255,255,0.56)">If this was not you, secure your account immediately.</p>
        </div>
      </div>
    `;

    const text = [
      `${this.appName} security notice: ${input.title}`,
      ``,
      `Hi ${input.fullName},`,
      ...input.details.map((d) => `- ${d}`),
    ].join("\n");

    await this.send({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  private async send(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    if (!this.resend) {
      this.logger.warn("Email provider not configured. Logging email instead.");
      this.logger.log(`To: ${input.to}`);
      this.logger.log(`Subject: ${input.subject}`);
      this.logger.log(`Text: ${input.text}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: this.replyTo ? [this.replyTo] : undefined,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${input.to}: ${error.message}`);
      throw new Error(error.message);
    }
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async sendPasswordResetEmail(input: {
  to: string;
  fullName?: string | null;
  resetUrl: string;
}) {
  const name = input.fullName?.trim() || "there";

  await this.send({
    to: input.to,
    subject: "Reset your Skuully password",
    text: `Hi ${name}, we received a request to reset your Skuully password. Open this link to continue: ${input.resetUrl} If you didn’t request this, you can ignore this email.`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #050505; color: #ffffff; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; background: #0b0b0b; padding: 32px;">
          <h1 style="font-size: 28px; margin: 0 0 16px;">Reset your password</h1>
          <p style="color: rgba(255,255,255,0.72); line-height: 1.7; margin: 0 0 20px;">
            Hi ${name}, we received a request to reset your Skuully password.
          </p>
          <p style="margin: 0 0 24px;">
            <a href="${input.resetUrl}" style="display: inline-block; background: #ffffff; color: #000000; text-decoration: none; padding: 14px 20px; border-radius: 999px; font-weight: 600;">
              Reset password
            </a>
          </p>
          <p style="color: rgba(255,255,255,0.52); line-height: 1.7; margin: 0;">
            If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

async sendPasswordChangedEmail(input: {
  to: string;
  fullName?: string | null;
}) {
  const name = input.fullName?.trim() || "there";

  await this.send({
    to: input.to,
    subject: "Your Skuully password was changed",
    text: `Hi ${name}, your Skuully password was successfully changed.`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #050505; color: #ffffff; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; background: #0b0b0b; padding: 32px;">
          <h1 style="font-size: 28px; margin: 0 0 16px;">Password updated</h1>
          <p style="color: rgba(255,255,255,0.72); line-height: 1.7; margin: 0;">
            Hi ${name}, your Skuully password was successfully changed.
          </p>
        </div>
      </div>
    `,
  });
}
}
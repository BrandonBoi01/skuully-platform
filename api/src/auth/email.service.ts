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
  private readonly webUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim();

    this.from =
      this.config.get<string>("EMAIL_FROM")?.trim() ||
      "Skuully <no-reply@auth.skuully.app>";

    this.replyTo =
      this.config.get<string>("EMAIL_REPLY_TO")?.trim() || undefined;

    this.appName = this.config.get<string>("APP_NAME")?.trim() || "Skuully";

    this.appUrl =
      this.config.get<string>("APP_URL")?.trim() || "https://skuully.app";

    this.webUrl =
      this.config.get<string>("WEB_URL")?.trim() ||
      this.config.get<string>("FRONTEND_URL")?.trim() ||
      "https://skuully.app";

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
    const firstName = this.firstNameFromFullName(input.fullName);
    const subject = `Verify your ${this.appName} email`;

    const html = this.renderEmailTemplate({
      preheader: `Your ${this.appName} verification code is ${input.code}.`,
      headerLabel: "Email verification",
      title: "Confirm your email",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, enter the code below to verify your email and continue with your ${this.appName} account.`,
      bodyHtml: `
        ${this.renderCodeBlock(input.code)}
        <p style="${this.textStyle("body-muted")} margin:16px 0 0;">
          This code expires in <strong style="color:#ffffff;">10 minutes</strong>.
        </p>
      `,
      supportNote:
        "If you didn’t request this, you can safely ignore this email.",
      footerTagline: "The future of education is here.",
    });

    const text = [
      `Verify your ${this.appName} email`,
      ``,
      `Hi ${firstName},`,
      `Enter this code to verify your email: ${input.code}`,
      `This code expires in 10 minutes.`,
      ``,
      `If you didn’t request this, you can safely ignore this email.`,
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
    const firstName = this.firstNameFromFullName(input.fullName);
    const subject = `Welcome to ${this.appName}`;

    const html = this.renderEmailTemplate({
      preheader: `Your ${this.appName} account is ready.`,
      headerLabel: "Welcome",
      title: "You’re all set",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, your account is ready. ${this.appName} brings identity, learning, and academic operations into one connected experience.`,
      bodyHtml: `
        <p style="${this.textStyle("body-main")} margin:0 0 18px;">
          Start with your workspace and continue building your path inside Skuully.
        </p>
        ${this.renderButton(this.appUrl, `Open ${this.appName}`)}
      `,
      supportNote: `You’re receiving this email because your ${this.appName} account was successfully activated.`,
      footerTagline:
        "Connected identity, learning, and operations for modern education.",
    });

    const text = [
      `Welcome to ${this.appName}`,
      ``,
      `Hi ${firstName},`,
      `Your account is ready.`,
      `Open ${this.appUrl}`,
      ``,
      `You’re receiving this email because your account was successfully activated.`,
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
    const firstName = this.firstNameFromFullName(input.fullName);
    const subject = `${this.appName} security notice`;

    const detailsHtml = input.details
      .map(
        (item) => `
          <tr>
            <td style="padding:0 0 10px 0; vertical-align:top;">
              <span style="display:inline-block; width:7px; height:7px; border-radius:999px; background:#5d5af6; margin-right:10px;"></span>
              <span style="font-size:14px; line-height:24px; color:#d6def5;">${this.escapeHtml(
                item
              )}</span>
            </td>
          </tr>
        `
      )
      .join("");

    const html = this.renderEmailTemplate({
      preheader: `${input.title} — important account security information.`,
      headerLabel: "Security notice",
      title: this.escapeHtml(input.title),
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, we noticed an important security event on your ${this.appName} account.`,
      bodyHtml: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${detailsHtml}
        </table>
      `,
      supportNote:
        "If you don’t recognize this activity, secure your account immediately.",
      footerTagline: "Secure identity for the future of education.",
    });

    const text = [
      `${this.appName} security notice`,
      ``,
      `Hi ${firstName},`,
      input.title,
      ...input.details.map((d) => `- ${d}`),
      ``,
      `If you don’t recognize this activity, secure your account immediately.`,
    ].join("\n");

    await this.send({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(input: {
    to: string;
    fullName?: string | null;
    resetUrl: string;
  }) {
    const firstName = this.firstNameFromFullName(input.fullName);
    const subject = `Reset your ${this.appName} password`;

    const html = this.renderEmailTemplate({
      preheader: `Reset your ${this.appName} password.`,
      headerLabel: "Password reset",
      title: "Reset your password",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, we received a request to reset your ${this.appName} password.`,
      bodyHtml: `
        <p style="${this.textStyle("body-main")} margin:0 0 18px;">
          Use the button below to choose a new password.
        </p>
        ${this.renderButton(input.resetUrl, "Reset password")}
      `,
      supportNote:
        "If you didn’t request this, you can safely ignore this email.",
      footerTagline: "Secure access for the future of education.",
    });

    const text = [
      `Reset your ${this.appName} password`,
      ``,
      `Hi ${firstName},`,
      `We received a request to reset your password.`,
      `Open this link to continue: ${input.resetUrl}`,
      ``,
      `If you didn’t request this, you can safely ignore this email.`,
    ].join("\n");

    await this.send({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  async sendPasswordChangedEmail(input: {
    to: string;
    fullName?: string | null;
  }) {
    const firstName = this.firstNameFromFullName(input.fullName);
    const subject = `Your ${this.appName} password was changed`;

    const html = this.renderEmailTemplate({
      preheader: `Your ${this.appName} password was changed successfully.`,
      headerLabel: "Security update",
      title: "Password updated",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, your ${this.appName} password was changed successfully.`,
      bodyHtml: `
        <p style="${this.textStyle("body-main")} margin:0;">
          If you made this change, no further action is needed.
        </p>
      `,
      supportNote:
        "If this wasn’t you, secure your account immediately.",
      footerTagline: "Secure identity, trusted access, connected education.",
    });

    const text = [
      `Your ${this.appName} password was changed`,
      ``,
      `Hi ${firstName},`,
      `Your password was changed successfully.`,
      ``,
      `If this wasn’t you, secure your account immediately.`,
    ].join("\n");

    await this.send({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  private renderEmailTemplate(input: {
    preheader: string;
    headerLabel: string;
    title: string;
    intro: string;
    bodyHtml: string;
    supportNote?: string;
    footerTagline: string;
  }) {
    const year = new Date().getFullYear();
    const headerLogoUrl = this.assetUrl("/skuully-originallogo-originalname.svg");
    const footerLogoUrl = this.assetUrl("/skuully-originallogo-originalname.svg");

    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f8;font-family:'Open Sans',Arial,Helvetica,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      ${this.escapeHtml(input.preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f4f8;">
      <tr>
        <td align="center" style="padding:24px 12px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;">
            
            <!-- Header -->
            <tr>
              <td style="background:#ffffff;padding:18px 20px;border-top-left-radius:20px;border-top-right-radius:20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" align="left">
                      <img
                        src="${this.escapeHtml(headerLogoUrl)}"
                        alt="${this.escapeHtml(this.appName)}"
                        width="112"
                        style="display:block;max-width:112px;height:auto;border:0;"
                      />
                    </td>
                    <td valign="middle" align="right" style="font-size:12px;line-height:18px;color:#7c86a5;">
                      ${this.escapeHtml(input.headerLabel)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Divider top -->
            <tr>
              <td style="height:3px;background:linear-gradient(90deg,#4a73eb 0%,#6a56c7 38%,#a55e95 68%,#c6264a 100%);font-size:0;line-height:0;">&nbsp;</td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background:#171b24;padding:30px 28px;">
                <h1 style="margin:0 0 12px;font-size:32px;line-height:38px;font-weight:700;color:#ffffff;">
                  ${this.escapeHtml(input.title)}
                </h1>

                <p style="${this.textStyle("body-main")} margin:0 0 24px;">
                  ${input.intro}
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background:#222735;border:1px solid #353d52;border-radius:16px;padding:20px;">
                      ${input.bodyHtml}
                    </td>
                  </tr>
                </table>

                ${
                  input.supportNote
                    ? `
                <p style="${this.textStyle("body-muted")} margin:20px 0 0;">
                  ${this.escapeHtml(input.supportNote)}
                </p>
                `
                    : ""
                }
              </td>
            </tr>

            <!-- Divider bottom -->
            <tr>
              <td style="height:3px;background:linear-gradient(90deg,#4a73eb 0%,#6a56c7 38%,#a55e95 68%,#c6264a 100%);font-size:0;line-height:0;">&nbsp;</td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#ffffff;padding:20px 20px 22px;border-bottom-left-radius:20px;border-bottom-right-radius:20px;" align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="padding:0 0 10px;">
                      <img
                        src="${this.escapeHtml(footerLogoUrl)}"
                        alt="${this.escapeHtml(this.appName)}"
                        width="92"
                        style="display:block;max-width:92px;height:auto;border:0;margin:0 auto;"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 0 6px;font-size:11px;line-height:17px;color:#4b5563;">
                      ${this.escapeHtml(input.footerTagline)}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 0 4px;font-size:10px;line-height:16px;color:#6b7280;">
                      Skuully AI-powered technology for connected academic identity, learning, and operations.
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 0 4px;font-size:10px;line-height:16px;color:#6b7280;">
                      13th Floor, Bruce House, Standard Street, Nairobi CBD
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-size:10px;line-height:16px;color:#8a93a7;">
                      © ${year} Bracelgate Group Ltd. All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
  }

  private renderButton(url: string, label: string) {
    return `
      <a
        href="${this.escapeHtml(url)}"
        style="
          display:inline-block;
          padding:13px 18px;
          border-radius:12px;
          background:linear-gradient(135deg,#4a73eb 0%,#6a56c7 38%,#a55e95 68%,#c6264a 100%);
          color:#ffffff;
          text-decoration:none;
          font-size:14px;
          line-height:20px;
          font-weight:700;
        "
      >
        ${this.escapeHtml(label)}
      </a>
    `;
  }

  private renderCodeBlock(code: string) {
    return `
      <div
        style="
          padding:18px;
          border-radius:14px;
          background:#2a3040;
          border:1px solid #40495f;
          text-align:center;
        "
      >
        <div style="font-size:11px;line-height:16px;letter-spacing:0.18em;text-transform:uppercase;color:#a9b4cf;margin-bottom:12px;">
          Verification code
        </div>
        <div style="font-size:34px;line-height:38px;font-weight:800;letter-spacing:0.28em;color:#ffffff;">
          ${this.escapeHtml(code)}
        </div>
      </div>
    `;
  }

  private textStyle(tone: "body-main" | "body-muted") {
    if (tone === "body-main") {
      return "font-size:16px;line-height:28px;color:#e1e7f5;";
    }

    return "font-size:14px;line-height:24px;color:#aeb7cc;";
  }

  private firstNameFromFullName(fullName?: string | null) {
    return fullName?.trim()?.split(/\s+/)?.[0] || "there";
  }

  private assetUrl(path: string) {
    const base = this.webUrl.replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
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
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
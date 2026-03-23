import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { Assets } from "../common/utils/assets";

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

    this.appUrl =
      this.config.get<string>("APP_URL")?.trim() || "https://skuully.app";

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
      eyebrow: "Email verification",
      title: "Confirm your email",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, use the verification code below to activate your ${
        this.appName
      } account.`,
      sectionHtml: `
        ${this.renderCodeBlock(input.code)}
        <p style="${this.p("muted")} margin:16px 0 0;">
          This code expires in <strong style="color:#eef2ff;">10 minutes</strong>.
        </p>
      `,
      note: `You’re receiving this email because a verification request was made for your ${this.appName} account. If this wasn’t you, you can safely ignore this email.`,
      footerTagline: "The future of education is here.",
    });

    const text = [
      `Verify your ${this.appName} email`,
      ``,
      `Hi ${firstName},`,
      `Use this verification code: ${input.code}`,
      `This code expires in 10 minutes.`,
      ``,
      `You’re receiving this email because a verification request was made for your ${this.appName} account.`,
      `If this wasn’t you, you can ignore this email.`,
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
      eyebrow: "Welcome",
      title: "Your account is ready",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, your email has been verified and your ${
        this.appName
      } account is now active.`,
      sectionHtml: `
        <div style="margin-top:24px;">
          ${this.renderButton(this.appUrl, `Open ${this.appName}`)}
        </div>
      `,
      note: `You’re receiving this email because your ${this.appName} account was successfully verified and activated.`,
      footerTagline:
        "Skuully is building the intelligence layer for modern education — connecting identity, schools, learning, and operations in one calm system.",
    });

    const text = [
      `Welcome to ${this.appName}`,
      ``,
      `Hi ${firstName},`,
      `Your email has been verified and your account is now active.`,
      `Open ${this.appUrl}`,
      ``,
      `You’re receiving this email because your ${this.appName} account was successfully verified and activated.`,
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
    const subject = `${this.appName} security notice: ${input.title}`;

    const detailsHtml = input.details
      .map(
        (item) => `
          <tr>
            <td style="padding:0 0 10px 0; vertical-align:top;">
              <span style="display:inline-block; width:7px; height:7px; border-radius:999px; background:#4a73eb; margin-right:10px; transform:translateY(-1px);"></span>
              <span style="color:#d9e2ff; font-size:14px; line-height:24px;">${this.escapeHtml(
                item
              )}</span>
            </td>
          </tr>
        `
      )
      .join("");

    const html = this.renderEmailTemplate({
      preheader: `${input.title} — important account security information.`,
      eyebrow: "Security notice",
      title: input.title,
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, here’s an important update related to your account security.`,
      sectionHtml: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
          ${detailsHtml}
        </table>
      `,
      note: `You’re receiving this email because a security-related action or event was detected on your ${this.appName} account. If this wasn’t you, secure your account immediately.`,
      footerTagline: "Secure identity for the future of education.",
    });

    const text = [
      `${this.appName} security notice: ${input.title}`,
      ``,
      `Hi ${firstName},`,
      ...input.details.map((d) => `- ${d}`),
      ``,
      `You’re receiving this email because a security-related action or event was detected on your ${this.appName} account.`,
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
      eyebrow: "Password reset",
      title: "Reset your password",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, we received a request to reset your ${this.appName} password.`,
      sectionHtml: `
        <div style="margin-top:24px;">
          ${this.renderButton(input.resetUrl, "Reset password")}
        </div>
      `,
      note: `You’re receiving this email because a password reset was requested for your ${this.appName} account. If this wasn’t you, you can safely ignore this email.`,
      footerTagline:
        "Skuully helps power the future of education with secure identity and connected academic systems.",
    });

    const text = [
      `Reset your ${this.appName} password`,
      ``,
      `Hi ${firstName},`,
      `We received a request to reset your ${this.appName} password.`,
      `Open this link to continue: ${input.resetUrl}`,
      ``,
      `If this wasn’t you, you can safely ignore this email.`,
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
      eyebrow: "Security update",
      title: "Password updated",
      intro: `Hi ${this.escapeHtml(
        firstName
      )}, your ${this.appName} password was successfully changed.`,
      sectionHtml: `
        <div style="margin-top:8px;">
          <p style="${this.p("muted")} margin:0;">
            If you made this change, no further action is needed.
          </p>
        </div>
      `,
      note: `You’re receiving this email because your ${this.appName} password was changed. If this wasn’t you, secure your account immediately.`,
      footerTagline:
        "The future of education is secure, connected, and intelligent.",
    });

    const text = [
      `Your ${this.appName} password was changed`,
      ``,
      `Hi ${firstName},`,
      `Your ${this.appName} password was successfully changed.`,
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
    eyebrow: string;
    title: string;
    intro: string;
    sectionHtml: string;
    note: string;
    footerTagline: string;
  }) {
    const year = new Date().getFullYear();
    const logoSquare = Assets.logoSquare();

    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#050816; font-family:'Open Sans', Arial, Helvetica, sans-serif; color:#eef2ff;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${this.escapeHtml(input.preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; margin:0; padding:0; background-color:#050816;">
      <tr>
        <td align="center" style="padding:24px 16px 40px;">

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; margin:0 auto;">
            <tr>
              <td style="padding:0 0 16px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left" valign="middle">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td valign="middle" style="padding-right:12px;">
                            <img
                              src="${this.escapeHtml(logoSquare)}"
                              alt="${this.escapeHtml(this.appName)}"
                              width="40"
                              height="40"
                              style="display:block; width:40px; height:40px; border-radius:12px; border:0; outline:none; text-decoration:none;"
                            />
                          </td>
                          <td valign="middle">
                            <div style="font-size:16px; line-height:20px; font-weight:700; color:#ffffff;">
                              ${this.escapeHtml(this.appName)}
                            </div>
                            <div style="font-size:12px; line-height:18px; color:#9aa4c7;">
                              The future of education is here.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" valign="middle" style="font-size:12px; line-height:18px; color:#7f88ac;">
                      ${this.escapeHtml(input.eyebrow)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td>
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width:100%;
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:24px;
                    overflow:hidden;
                    background-color:#0b1020;
                    background-image:
                      radial-gradient(circle at top left, rgba(74,115,235,0.18), transparent 30%),
                      radial-gradient(circle at top right, rgba(106,86,199,0.16), transparent 28%),
                      linear-gradient(180deg, rgba(14,18,38,0.98) 0%, rgba(8,11,29,0.98) 100%);
                    box-shadow:0 20px 60px rgba(0,0,0,0.28);
                  "
                >
                  <tr>
                    <td style="padding:32px 28px 28px;">
                      <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:rgba(74,115,235,0.12); border:1px solid rgba(74,115,235,0.22); font-size:11px; line-height:16px; letter-spacing:0.14em; text-transform:uppercase; font-weight:700; color:#b9c8ff;">
                        ${this.escapeHtml(input.eyebrow)}
                      </div>

                      <h1 style="margin:18px 0 10px; font-size:30px; line-height:36px; font-weight:700; color:#ffffff;">
                        ${this.escapeHtml(input.title)}
                      </h1>

                      <p style="${this.p("main")} margin:0;">
                        ${input.intro}
                      </p>

                      <div style="margin-top:24px; padding:22px 20px; border-radius:20px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);">
                        ${input.sectionHtml}
                      </div>

                      <div style="margin-top:22px;">
                        <p style="${this.p("soft")} margin:0;">
                          ${this.escapeHtml(input.note)}
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 6px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 0 10px;">
                      <p style="margin:0; font-size:13px; line-height:22px; color:#a4add0;">
                        ${this.escapeHtml(input.footerTagline)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 8px;">
                      <p style="margin:0; font-size:12px; line-height:20px; color:#7f88ac;">
                        Skuully AI-powered technology for connected academic identity, learning, and operations.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 8px;">
                      <p style="margin:0; font-size:12px; line-height:20px; color:#7f88ac;">
                        13th Floor, Bruce House, Standard Street, Nairobi CBD
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 8px;">
                      <p style="margin:0; font-size:12px; line-height:20px; color:#7f88ac;">
                        You’re receiving this email because you have a Skuully account or recently interacted with a Skuully security or account action.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin:0; font-size:12px; line-height:20px; color:#6f789d;">
                        © ${year} Bracelgate Group Ltd. All rights reserved.
                      </p>
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
          padding:14px 20px;
          border-radius:14px;
          background:#4a73eb;
          background-image:linear-gradient(135deg,#4a73eb 0%, #6a56c7 38%, #a55e95 68%, #c6264a 100%);
          color:#ffffff;
          text-decoration:none;
          font-size:14px;
          line-height:20px;
          font-weight:700;
          box-shadow:0 12px 30px rgba(54,97,225,0.24), 0 8px 20px rgba(198,38,74,0.12);
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
          padding:18px 20px;
          border-radius:18px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.08);
          text-align:center;
        "
      >
        <div style="font-size:12px; line-height:18px; text-transform:uppercase; letter-spacing:0.18em; color:#9aa4c7; margin-bottom:10px;">
          Verification code
        </div>
        <div style="font-size:32px; line-height:38px; font-weight:800; letter-spacing:0.30em; color:#ffffff;">
          ${this.escapeHtml(code)}
        </div>
      </div>
    `;
  }

  private p(tone: "main" | "muted" | "soft") {
    if (tone === "main") {
      return "font-size:15px; line-height:26px; color:#d9e2ff;";
    }

    if (tone === "muted") {
      return "font-size:13px; line-height:22px; color:#9aa4c7;";
    }

    return "font-size:13px; line-height:22px; color:#a4add0;";
  }

  private firstNameFromFullName(fullName?: string | null) {
    return fullName?.trim()?.split(/\s+/)?.[0] || "there";
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
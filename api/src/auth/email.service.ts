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
  private readonly brandAddress: string;
  private readonly frontendBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim();

    this.from =
      this.config.get<string>("EMAIL_FROM")?.trim() ||
      "Skuully <no-reply@auth.skuully.app>";

    this.replyTo =
      this.config.get<string>("EMAIL_REPLY_TO")?.trim() || undefined;

    this.appName =
      this.config.get<string>("APP_NAME")?.trim() || "Skuully";

    this.appUrl =
      this.config.get<string>("APP_URL")?.trim() || "https://skuully.app";

    this.frontendBaseUrl =
      this.config.get<string>("FRONTEND_URL")?.trim() || "https://skuully.app";

    this.brandAddress =
      "13th Floor, Bruce House, Standard Street, Nairobi CBD";

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
      previewText: `Your verification code is ${input.code}`,
      label: "Email verification",
      title: "Confirm your email",
      intro: `Hi ${this.escapeHtml(firstName)}, use the verification code below to activate your ${this.appName} account.`,
      contentHtml: `
        ${this.renderCodeCard(input.code)}
        <p style="${this.textStyle("muted")} margin: 18px 0 0;">
          This code expires in <strong style="color:#111827;">10 minutes</strong>.
        </p>
      `,
      helperText:
        "You’re receiving this email because a verification request was made for your account. If this wasn’t you, you can safely ignore this email.",
      footerReason:
        "You received this email because of a Skuully account verification action.",
    });

    const text = [
      `Verify your ${this.appName} email`,
      ``,
      `Hi ${firstName},`,
      `Your verification code is: ${input.code}`,
      `This code expires in 10 minutes.`,
      ``,
      `You received this email because a verification request was made for your account.`,
      `If this wasn’t you, you can safely ignore this email.`,
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
      previewText: `Your ${this.appName} account is ready`,
      label: "Welcome",
      title: "Your account is ready",
      intro: `Hi ${this.escapeHtml(firstName)}, your email has been verified and your ${this.appName} account is now active.`,
      contentHtml: `
        <div style="margin-top: 8px;">
          ${this.renderButton(this.appUrl, `Open ${this.appName}`)}
        </div>
      `,
      helperText:
        "You can now continue into your account and begin setting up your workspace.",
      footerReason:
        "You received this email because your Skuully account was successfully activated.",
    });

    const text = [
      `Welcome to ${this.appName}`,
      ``,
      `Hi ${firstName},`,
      `Your email has been verified and your account is now active.`,
      `Open ${this.appUrl}`,
      ``,
      `You received this email because your account was successfully activated.`,
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
      previewText: `Reset your ${this.appName} password`,
      label: "Password reset",
      title: "Reset your password",
      intro: `Hi ${this.escapeHtml(firstName)}, we received a request to reset your ${this.appName} password.`,
      contentHtml: `
        <div style="margin-top: 8px;">
          ${this.renderButton(input.resetUrl, "Reset password")}
        </div>
      `,
      helperText:
        "If you didn’t request this, you can safely ignore this email. Your password will remain unchanged.",
      footerReason:
        "You received this email because a password reset was requested for your Skuully account.",
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
      previewText: `Your ${this.appName} password was changed`,
      label: "Security update",
      title: "Password updated",
      intro: `Hi ${this.escapeHtml(firstName)}, your ${this.appName} password was successfully changed.`,
      contentHtml: `
        <p style="${this.textStyle("main")} margin: 0;">
          If you made this change, no further action is needed.
        </p>
      `,
      helperText:
        "If this wasn’t you, secure your account immediately and reset your password.",
      footerReason:
        "You received this email because a security change was made on your Skuully account.",
    });

    const text = [
      `Your ${this.appName} password was changed`,
      ``,
      `Hi ${firstName},`,
      `Your password was successfully changed.`,
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
            <td style="padding:0 0 10px 0;">
              <span style="display:inline-block; width:6px; height:6px; border-radius:999px; background:#6a56c7; margin-right:10px;"></span>
              <span style="font-size:14px; line-height:24px; color:#374151;">${this.escapeHtml(
                item
              )}</span>
            </td>
          </tr>
        `
      )
      .join("");

    const html = this.renderEmailTemplate({
      previewText: input.title,
      label: "Security notice",
      title: this.escapeHtml(input.title),
      intro: `Hi ${this.escapeHtml(firstName)}, here is an important update related to your account security.`,
      contentHtml: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${detailsHtml}
        </table>
      `,
      helperText:
        "If this activity was not yours, secure your account immediately.",
      footerReason:
        "You received this email because a security-related account event was detected on Skuully.",
    });

    const text = [
      `${this.appName} security notice: ${input.title}`,
      ``,
      `Hi ${firstName},`,
      ...input.details.map((d) => `- ${d}`),
      ``,
      `You received this email because a security-related account event was detected.`,
    ].join("\n");

    await this.send({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  private renderEmailTemplate(input: {
    previewText: string;
    label: string;
    title: string;
    intro: string;
    contentHtml: string;
    helperText: string;
    footerReason: string;
  }) {
    const year = new Date().getFullYear();

    const logoWithName = `${this.frontendBaseUrl}/skuully-originallogo-originalname.svg`;
    const footerLogo = `${this.frontendBaseUrl}/logo.png`;

    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>${this.escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f3f4f6; font-family:'Open Sans', Arial, Helvetica, sans-serif; color:#111827;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      ${this.escapeHtml(input.previewText)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background:#f3f4f6; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb;">
            
            <tr>
              <td style="padding:28px 28px 20px; border-bottom:1px solid #eceff5;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" align="left">
                      <img
                        src="${this.escapeHtml(logoWithName)}"
                        alt="${this.escapeHtml(this.appName)}"
                        style="display:block; max-width:150px; height:auto; border:0;"
                        width="150"
                      />
                    </td>
                    <td valign="middle" align="right" style="font-size:13px; line-height:20px; color:#6b7280;">
                      ${this.escapeHtml(input.label)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0;">
                <div style="height:4px; background:linear-gradient(90deg,#4a73eb 0%, #6a56c7 40%, #a55e95 72%, #c6264a 100%);"></div>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 28px 28px; background:#ffffff;">
                <h1 style="margin:0 0 14px; font-size:34px; line-height:40px; font-weight:700; color:#111827;">
                  ${this.escapeHtml(input.title)}
                </h1>

                <p style="${this.textStyle("main")} margin:0 0 24px;">
                  ${input.intro}
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;">
                  <tr>
                    <td style="padding:24px; background:#0b1020; border:1px solid #1c2748;">
                      ${input.contentHtml}
                    </td>
                  </tr>
                </table>

                <p style="${this.textStyle("muted")} margin:0;">
                  ${this.escapeHtml(input.helperText)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 28px 28px; border-top:1px solid #eceff5; background:#fafafa;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="padding:0 0 12px;">
                      <img
                        src="${this.escapeHtml(footerLogo)}"
                        alt="${this.escapeHtml(this.appName)}"
                        width="32"
                        height="32"
                        style="display:block; width:32px; height:32px; border-radius:8px; border:0;"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 0 8px; font-size:13px; line-height:22px; color:#374151;">
                      The future of education is here.
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 0 6px; font-size:12px; line-height:20px; color:#6b7280;">
                      ${this.escapeHtml(this.brandAddress)}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 0 6px; font-size:12px; line-height:20px; color:#6b7280;">
                      ${this.escapeHtml(input.footerReason)}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-size:12px; line-height:20px; color:#9ca3af;">
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
          padding:14px 22px;
          border-radius:12px;
          background:linear-gradient(135deg,#4a73eb 0%, #6a56c7 40%, #a55e95 72%, #c6264a 100%);
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

  private renderCodeCard(code: string) {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td
            style="
              padding:22px 20px;
              background:#151b31;
              border:1px solid #2a3358;
              text-align:center;
            "
          >
            <div style="font-size:12px; line-height:18px; letter-spacing:0.16em; text-transform:uppercase; color:#a8b1d8; margin-bottom:12px;">
              Verification code
            </div>
            <div style="font-size:34px; line-height:40px; font-weight:800; letter-spacing:0.28em; color:#ffffff;">
              ${this.escapeHtml(code)}
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  private textStyle(tone: "main" | "muted") {
    if (tone === "main") {
      return "font-size:16px; line-height:28px; color:#374151;";
    }

    return "font-size:13px; line-height:22px; color:#6b7280;";
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
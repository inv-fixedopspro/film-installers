import { APP_NAME, APP_DOMAIN } from "@/lib/constants";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.error("SendGrid API key not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL },
        subject,
        content: [
          ...(text ? [{ type: "text/plain", value: text }] : []),
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", errorText);
      return { success: false, error: "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<EmailResult> {
  const verifyUrl = `https://${APP_DOMAIN}/verify-email/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #5C4033 0%, #8B7355 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${APP_NAME}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333333; margin-top: 0;">Verify Your Email</h2>
        <p>Welcome to ${APP_NAME}! Please click the button below to verify your email address and complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #5C4033; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600;">Verify Email Address</a>
        </div>
        <p style="color: #666666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666666; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
        <p style="color: #666666; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
        <p style="color: #999999; font-size: 12px; text-align: center;">If you didn't create an account with ${APP_NAME}, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to ${APP_NAME}!

Please verify your email address by visiting the following link:
${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
  `;

  return sendEmail({
    to: email,
    subject: `Verify your email - ${APP_NAME}`,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<EmailResult> {
  const resetUrl = `https://${APP_DOMAIN}/reset-password/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #5C4033 0%, #8B7355 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${APP_NAME}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333333; margin-top: 0;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #5C4033; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600;">Reset Password</a>
        </div>
        <p style="color: #666666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666666; font-size: 14px;">This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
        <p style="color: #999999; font-size: 12px; text-align: center;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset Your Password

We received a request to reset your password for ${APP_NAME}.

Please visit the following link to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
  `;

  return sendEmail({
    to: email,
    subject: `Reset your password - ${APP_NAME}`,
    html,
    text,
  });
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  inviterName?: string,
  role: "admin" | "user" = "user"
): Promise<EmailResult> {
  const inviteUrl = `https://${APP_DOMAIN}/invite/${token}`;
  const roleLabel = role === "admin" ? "an administrator" : "a member";
  const inviterText = inviterName ? ` by ${inviterName}` : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #5C4033 0%, #8B7355 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${APP_NAME}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333333; margin-top: 0;">You're Invited!</h2>
        <p>You've been invited${inviterText} to join ${APP_NAME} as ${roleLabel}.</p>
        <p>Click the button below to accept your invitation and create your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background-color: #5C4033; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600;">Accept Invitation</a>
        </div>
        <p style="color: #666666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666666; font-size: 14px; word-break: break-all;">${inviteUrl}</p>
        <p style="color: #666666; font-size: 14px;">This invitation will expire in 7 days.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
        <p style="color: #999999; font-size: 12px; text-align: center;">If you weren't expecting this invitation, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
You're Invited to ${APP_NAME}!

You've been invited${inviterText} to join ${APP_NAME} as ${roleLabel}.

Please visit the following link to accept your invitation and create your account:
${inviteUrl}

This invitation will expire in 7 days.

If you weren't expecting this invitation, you can safely ignore this email.
  `;

  return sendEmail({
    to: email,
    subject: `You're invited to join ${APP_NAME}`,
    html,
    text,
  });
}

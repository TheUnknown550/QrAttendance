import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

type PasswordResetMailPayload = {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type OrganizationInactiveWarningPayload = {
  to: string[];
  organizationName: string;
  lastActivityAt: Date;
  scheduledDeletionAt: Date;
};

type PasswordChangedSuccessPayload = {
  to: string;
  changedAt: Date;
};

export async function sendPasswordResetEmail(payload: PasswordResetMailPayload) {
  const previewText = `Reset your EventQR password. This link expires in ${payload.expiresInMinutes} minutes.`;

  const html = `
    <div style="display:none;opacity:0;overflow:hidden;max-height:0;max-width:0;">
      ${previewText}
    </div>
    <div style="margin:0;padding:24px 0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;">
              <tr>
                <td style="padding:0 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                    <tr>
                      <td style="padding:26px 28px;background:linear-gradient(145deg,#fff7ed 0%,#fffbeb 100%);border-bottom:1px solid #f1f5f9;">
                        <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#b45309;font-weight:700;">
                          EventQR
                        </p>
                        <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#0f172a;">
                          Password reset request
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:26px 28px;">
                        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                          We received a request to reset your account password.
                        </p>
                        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">
                          This secure link expires in <strong>${payload.expiresInMinutes} minutes</strong>.
                        </p>
                        <p style="margin:0 0 20px;">
                          <a
                            href="${payload.resetUrl}"
                            style="display:inline-block;padding:12px 18px;background:#d97706;color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;"
                          >
                            Reset password
                          </a>
                        </p>
                        <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#64748b;">
                          If the button does not work, use this link:
                        </p>
                        <p style="margin:0 0 18px;font-size:13px;line-height:1.7;word-break:break-all;color:#0f172a;">
                          <a href="${payload.resetUrl}" style="color:#b45309;text-decoration:none;">${payload.resetUrl}</a>
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;">
                          <tr>
                            <td style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                                If you did not request this reset, you can safely ignore this email.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                    Need help? Contact
                    <a href="mailto:support@magitecx.com" style="color:#b45309;text-decoration:none;">support@magitecx.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "Reset your EventQR password",
    "",
    `Open this link to reset your password: ${payload.resetUrl}`,
    "",
    `This link expires in ${payload.expiresInMinutes} minutes.`,
    "If you did not request this, ignore this email.",
    "Support: support@magitecx.com",
  ].join("\n");

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: payload.to,
    subject: "EventQR password reset",
    html,
    text,
  });
}

export async function sendOrganizationInactiveWarningEmail(
  payload: OrganizationInactiveWarningPayload,
) {
  if (payload.to.length === 0) {
    return;
  }

  const settingsUrl = new URL("/app/settings/organization", env.APP_URL).toString();
  const previewText = `${payload.organizationName} is inactive and scheduled for deletion.`;

  const html = `
    <div style="display:none;opacity:0;overflow:hidden;max-height:0;max-width:0;">
      ${previewText}
    </div>
    <div style="margin:0;padding:24px 0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;">
              <tr>
                <td style="padding:0 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                    <tr>
                      <td style="padding:26px 28px;background:linear-gradient(145deg,#fff1f2 0%,#fff7ed 100%);border-bottom:1px solid #f1f5f9;">
                        <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#b45309;font-weight:700;">
                          EventQR
                        </p>
                        <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#0f172a;">
                          Workspace inactivity warning
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:26px 28px;">
                        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                          Your workspace <strong>${payload.organizationName}</strong> is inactive.
                        </p>
                        <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#334155;">
                          Last activity: <strong>${payload.lastActivityAt.toUTCString()}</strong>
                        </p>
                        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">
                          Scheduled deletion: <strong>${payload.scheduledDeletionAt.toUTCString()}</strong>
                        </p>
                        <p style="margin:0 0 20px;">
                          <a
                            href="${settingsUrl}"
                            style="display:inline-block;padding:12px 18px;background:#d97706;color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;"
                          >
                            Open workspace settings
                          </a>
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;">
                          <tr>
                            <td style="padding:12px 14px;background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;">
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#9f1239;">
                                If no new activity happens before the scheduled deletion date, this workspace and its organization-scoped data will be permanently removed.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                    Need help? Contact
                    <a href="mailto:support@magitecx.com" style="color:#b45309;text-decoration:none;">support@magitecx.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "Workspace inactivity warning",
    "",
    `Workspace: ${payload.organizationName}`,
    `Last activity: ${payload.lastActivityAt.toUTCString()}`,
    `Scheduled deletion: ${payload.scheduledDeletionAt.toUTCString()}`,
    "",
    `Open settings: ${settingsUrl}`,
    "",
    "If no new activity happens before the scheduled deletion date, this workspace and its organization-scoped data will be permanently removed.",
    "Support: support@magitecx.com",
  ].join("\n");

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: payload.to,
    subject: `EventQR inactivity warning: ${payload.organizationName}`,
    html,
    text,
  });
}

export async function sendPasswordChangedSuccessEmail(payload: PasswordChangedSuccessPayload) {
  const previewText = "Your EventQR password was changed successfully.";

  const html = `
    <div style="display:none;opacity:0;overflow:hidden;max-height:0;max-width:0;">
      ${previewText}
    </div>
    <div style="margin:0;padding:24px 0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;">
              <tr>
                <td style="padding:0 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                    <tr>
                      <td style="padding:26px 28px;background:linear-gradient(145deg,#ecfdf5 0%,#f8fafc 100%);border-bottom:1px solid #f1f5f9;">
                        <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#047857;font-weight:700;">
                          EventQR
                        </p>
                        <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#0f172a;">
                          Password changed
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:26px 28px;">
                        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                          Your account password was changed successfully.
                        </p>
                        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">
                          Change time: <strong>${payload.changedAt.toUTCString()}</strong>
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;">
                          <tr>
                            <td style="padding:12px 14px;background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;">
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#9f1239;">
                                If you did not make this change, reset your password immediately and contact support.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                    Need help? Contact
                    <a href="mailto:support@magitecx.com" style="color:#b45309;text-decoration:none;">support@magitecx.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "Password changed",
    "",
    "Your EventQR account password was changed successfully.",
    `Change time: ${payload.changedAt.toUTCString()}`,
    "",
    "If you did not make this change, reset your password immediately and contact support.",
    "Support: support@magitecx.com",
  ].join("\n");

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: payload.to,
    subject: "EventQR password changed",
    html,
    text,
  });
}

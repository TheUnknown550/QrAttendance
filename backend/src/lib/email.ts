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

type AttendeeQrCodeMailPayload = {
  to: string;
  firstName: string;
  surname: string;
  attendeeOrganizationName?: string | null;
  attendeeType?: string | null;
  attendeeNumber?: number | null;
  organizationName: string;
  eventName: string;
  subject?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  message?: string | null;
  qrPngBuffer: Buffer;
  qrImageWidth?: number;
  qrImageHeight?: number;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendAttendeeQrCodeEmail(payload: AttendeeQrCodeMailPayload) {
  const fullName = `${payload.firstName} ${payload.surname}`.trim();
  const previewText = `Your check-in QR code for ${payload.eventName}`;
  const safeFullName = escapeHtml(fullName);
  const safeEventName = escapeHtml(payload.eventName);
  const safeOrganizationName = escapeHtml(payload.organizationName);
  const safeEventDate = payload.eventDate ? escapeHtml(payload.eventDate) : null;
  const safeEventLocation = payload.eventLocation ? escapeHtml(payload.eventLocation) : null;
  const safeMessage = payload.message ? escapeHtml(payload.message) : null;
  const safeAttendeeOrganizationName = payload.attendeeOrganizationName
    ? escapeHtml(payload.attendeeOrganizationName)
    : null;
  const safeAttendeeType = payload.attendeeType ? escapeHtml(payload.attendeeType) : null;
  const safeAttendeeNumber = payload.attendeeNumber != null ? String(payload.attendeeNumber) : null;

  const sourceWidth = payload.qrImageWidth ?? 480;
  const sourceHeight = payload.qrImageHeight ?? 480;
  const qrDisplayWidth = Math.min(sourceWidth, 260);
  const qrDisplayHeight = Math.round((sourceHeight / sourceWidth) * qrDisplayWidth);

  function buildDetailRowsHtml(rows: Array<{ label: string; value: string } | null>) {
    return rows
      .filter((row): row is { label: string; value: string } => row !== null)
      .map(
        (row) => `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;width:110px;vertical-align:top;">${row.label}</td>
            <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${row.value}</td>
          </tr>
        `,
      )
      .join("");
  }

  const eventDetailRowsHtml = buildDetailRowsHtml([
    safeEventDate ? { label: "Date", value: safeEventDate } : null,
    safeEventLocation ? { label: "Location", value: safeEventLocation } : null,
  ]);

  const ticketDetailRowsHtml = buildDetailRowsHtml([
    { label: "Name", value: safeFullName },
    safeAttendeeOrganizationName ? { label: "Organization", value: safeAttendeeOrganizationName } : null,
    safeAttendeeType ? { label: "Type", value: safeAttendeeType } : null,
    safeAttendeeNumber ? { label: "Ticket #", value: safeAttendeeNumber } : null,
  ]);

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
                        <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;color:#0f172a;">
                          ${safeEventName}
                        </h1>
                        <p style="margin:6px 0 0;font-size:13px;color:#92400e;">
                          Hosted by ${safeOrganizationName}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:26px 28px;">
                        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                          Dear Sir/Madam,
                        </p>
                        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">
                          Here is your personal check-in QR code. Show it at the entrance and it will be scanned for attendance &mdash; no need to print anything, just have this email open on your phone.
                        </p>

                        ${
                          eventDetailRowsHtml
                            ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;margin-bottom:16px;">
                                <tr>
                                  <td style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;font-weight:700;">
                                      Event details
                                    </p>
                                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                      ${eventDetailRowsHtml}
                                    </table>
                                  </td>
                                </tr>
                              </table>`
                            : ""
                        }

                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;margin-bottom:16px;">
                          <tr>
                            <td align="center" style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                              <img
                                alt="Your check-in QR code"
                                src="cid:attendee-qr-code"
                                style="display:block;width:${qrDisplayWidth}px;height:${qrDisplayHeight}px;border-radius:8px;"
                              />
                              <p style="margin:14px 0 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">
                                Scan at check-in
                              </p>
                            </td>
                          </tr>
                        </table>

                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;margin-bottom:16px;">
                          <tr>
                            <td style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;font-weight:700;">
                                Ticket holder
                              </p>
                              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                ${ticketDetailRowsHtml}
                              </table>
                            </td>
                          </tr>
                        </table>

                        ${
                          safeMessage
                            ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;margin-bottom:8px;">
                                <tr>
                                  <td style="padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                                    <p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;">
                                      ${safeMessage}
                                    </p>
                                  </td>
                                </tr>
                              </table>`
                            : ""
                        }
                      </td>
                    </tr>
                  </table>
                  <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                    Sent by ${safeOrganizationName} via EventQR &middot;
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
    `Your check-in QR code for ${payload.eventName}`,
    "",
    "Dear Sir/Madam,",
    "",
    "Your personal check-in QR code is attached to this email as an image.",
    "Open it on your phone and show it at the entrance to check in.",
    "",
    payload.eventDate ? `Date: ${payload.eventDate}` : "",
    payload.eventLocation ? `Location: ${payload.eventLocation}` : "",
    "",
    "Ticket holder:",
    `Name: ${fullName}`,
    payload.attendeeOrganizationName ? `Organization: ${payload.attendeeOrganizationName}` : "",
    payload.attendeeType ? `Type: ${payload.attendeeType}` : "",
    payload.attendeeNumber != null ? `Ticket #: ${payload.attendeeNumber}` : "",
    payload.message ? `\n${payload.message}` : "",
    "",
    `Hosted by ${payload.organizationName} via EventQR`,
    "Support: support@magitecx.com",
  ]
    .filter((line) => line !== "")
    .join("\n");

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: payload.to,
    subject: payload.subject?.trim() || `Your check-in QR code for ${payload.eventName}`,
    html,
    text,
    attachments: [
      {
        content: payload.qrPngBuffer,
        filename: "qr-code.png",
        contentType: "image/png",
        contentId: "attendee-qr-code",
      },
    ],
  });
}

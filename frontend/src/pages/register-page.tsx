import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { BrandBadge } from "../components/brand/brand-badge";
import { BrandLogo } from "../components/brand/brand-logo";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Seo } from "../components/seo/seo";
import { api, getErrorMessage, unwrapResponse } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { RegisterPayload } from "../types/api";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(6),
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: "You must agree before creating an account",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const registerSideContent = {
  terms: {
    title: "Terms of Service",
    body: `Last updated May 20, 2026

These Terms of Service govern access to and use of EventQR, a QR attendance platform powered by Magitecx, including the website, dashboard, scanner tools, reports, exports, documentation, and related support services.

By creating an account, joining a workspace, using a scanner link, or otherwise accessing the service, you agree to these Terms. If you use EventQR on behalf of an organization, you represent that you are authorized to bind that organization to these Terms.

Accounts and roles:
Users create individual accounts first and may then create or join one or more organizations. Organizations may assign roles such as owner, admin, or member. You are responsible for actions taken through your account and for keeping your credentials secure. You must provide accurate information and update account details when they change.

Acceptable use:
You may use EventQR only for legitimate attendance, event operations, workspace collaboration, and related administrative purposes. You may not misuse the service, interfere with scanner or reporting operations, attempt unauthorized access, upload malicious files, abuse public scan links, scrape data without permission, or use the platform to violate privacy, intellectual property, or other legal rights. We may suspend or restrict access if we reasonably believe an account or workspace is being used unlawfully, abusively, or in a way that threatens the service or other users.

Workspace data:
Your organization is responsible for the attendee, event, and attendance data it creates, imports, or uploads into EventQR. You represent that you have the right to upload attendee information and profile images and to use those records for your organization’s attendance workflows. We provide the software service and related operational tooling, but you remain responsible for your internal consent, notice, and data handling obligations to your attendees and staff.

Deletion and inactivity:
EventQR includes an automatic organization-level cleanup lifecycle intended to reduce unused data and storage overhead. By default, a workspace may be marked inactive after 75 days without meaningful activity and may be permanently deleted after 90 days from the last real activity if inactivity continues. Activity can include login, switching organizations, attendee changes, event and session changes, invite actions, attendance scans, scanner share-link generation, and certain organization-setting actions. When a workspace is permanently deleted, organization-scoped data may be removed, including event series, event sessions, attendees, attendance records, invites, organization memberships for that workspace, and stored attendee profile images. User accounts are not automatically deleted when a workspace is purged. Users may continue using other organizations associated with their accounts. Replaced, removed, or orphaned uploaded files may also be deleted earlier as part of routine file management and security cleanup.

Intellectual property:
EventQR, its software, branding, interface design, documentation, and related service materials remain the property of Magitecx or its licensors, except for customer-provided content. You retain rights to the content and data your organization uploads, subject to the rights needed for us to host, process, display, export, secure, and support that content within the service.

Availability and changes:
We may update, improve, modify, or discontinue features as the product evolves. We may also suspend portions of the service for maintenance, security, or operational reasons. We aim to operate the service professionally, but we do not guarantee uninterrupted availability, error-free performance, or compatibility with every device, browser, or camera environment.

Disclaimers and limitation of liability:
To the maximum extent permitted by law, EventQR is provided on an “as is” and “as available” basis without warranties of merchantability, fitness for a particular purpose, or non-infringement. To the maximum extent permitted by law, Magitecx will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, goodwill, data, or business opportunities arising from or related to use of the service. To the maximum extent permitted by law, any direct liability related to the service will be limited to the amount paid, if any, for the applicable service period directly preceding the event giving rise to the claim.

Contact and updates:
Questions about these Terms can be sent to support@magitecx.com. We may update these Terms from time to time. Continued use of EventQR after an update becomes effective constitutes acceptance of the revised Terms.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `Last updated May 20, 2026

This Privacy Policy explains how EventQR, powered by Magitecx, collects, uses, stores, and deletes information when you use the EventQR website, dashboard, scanner flows, support channels, and related services.

EventQR is designed for organizations that manage attendees, recurring event series, attendance check-ins, and reporting. By using the service, you acknowledge that your organization may upload attendee information and attendance data into the platform.

Data we collect:
We collect account data such as name, email address, password hash, organization memberships, role assignments, and account activity needed to authenticate and manage access. We collect organization data such as workspace names, join codes, invite records, event series, event sessions, settings, inactivity status, and scheduled deletion metadata. We collect attendee data such as attendee names, email addresses, phone numbers, profile images, QR tokens, and attendance history created by the organization using the service. We also collect technical and support data such as browser and device information, IP-derived operational logs, password reset requests, and messages you send to support.

How we use data:
We use personal and workspace data to provide authentication, organization membership, scanner flows, attendee management, reports, exports, and support operations. We also use data to maintain service security, investigate misuse, send service emails such as password resets and inactivity warnings, and improve the reliability of the platform. We do not sell attendee or account personal information.

Sharing:
We share data only as needed to operate the service, such as with infrastructure, email, hosting, database, and security providers acting on our behalf. Password reset and notification emails are sent through Resend. We may also disclose information if reasonably necessary to comply with law, enforce our Terms, prevent fraud, or protect users, EventQR, Magitecx, or the public.

Retention and deletion:
EventQR stores organization data for as long as the workspace remains active or until it is removed under the product’s inactivity lifecycle or an administrative deletion action. By default, organizations may be marked inactive after 75 days without meaningful workspace activity and may be permanently deleted after 90 days from the last real activity if inactivity continues. When an organization is permanently deleted, organization-scoped data may be removed, including attendees, event series, event sessions, attendance records, invites, workspace memberships for that organization, and stored attendee profile images. User accounts are not automatically deleted when an organization is purged. Replaced or removed attendee profile images may be deleted earlier as part of file cleanup and storage management.

Security:
We use access controls, password hashing, secure token flows, protected dashboard routes, and server-side validation in support of the service. Attendee profile images are validated and re-encoded server-side, and only supported image formats are accepted by the current upload flow. No system is completely secure, and you are responsible for safeguarding your account credentials.

Your choices:
Users can update account details, change passwords, switch organizations, and manage workspace records according to their role permissions. Organization administrators control most attendee and event data inside their workspaces, including updates, exports, and deletions.

Contact:
Questions about this Privacy Policy or privacy-related requests can be sent to support@magitecx.com. This document is a product-facing policy draft and should be reviewed for your business entity details, local law requirements, and final publication requirements before production launch.`,
  },
} as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const { auth, isInitializing } = useAuth();
  const [activeDocument, setActiveDocument] = useState<keyof typeof registerSideContent | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (!isInitializing && auth) {
      navigate("/app", { replace: true });
    }
  }, [auth, isInitializing, navigate]);

  const mutation = useMutation({
    mutationFn: async (values: RegisterPayload) =>
      unwrapResponse<null>(await api.post("/auth/register", values)),
    onSuccess: () => {
      navigate("/login");
    },
  });

  const sideDocument = activeDocument ? registerSideContent[activeDocument] : null;

  return (
    <div className="min-h-screen px-4 py-6">
      <Seo
        description="Create your EventQR account, then create or join an organization to manage recurring event attendance with QR check-ins."
        noindex
        pathname="/register"
        title="Create Account"
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link className="font-display text-2xl font-semibold text-slate-900" to="/">
            EventQR
          </Link>
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-8">
            <div className="flex items-center gap-3">
              <BrandLogo imageClassName="h-12" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Register</p>
                <p className="text-sm text-slate-500">Create account first</p>
              </div>
            </div>

            <h1 className="mt-6 font-display text-4xl font-semibold text-slate-900">Create account</h1>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Name</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input className="pl-11" placeholder="Jordan Lee" {...register("name")} />
                </div>
                {errors.name ? <p className="mt-2 text-xs text-rose-500">{errors.name.message}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input autoComplete="email" className="pl-11" placeholder="jordan@example.com" {...register("email")} />
                </div>
                {errors.email ? <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-400" />
                  <Input
                    autoComplete="new-password"
                    className="pl-11"
                    placeholder="At least 6 characters"
                    type="password"
                    {...register("password")}
                  />
                </div>
                {errors.password ? <p className="mt-2 text-xs text-rose-500">{errors.password.message}</p> : null}
              </label>

              <label className="flex items-start gap-3 rounded-[8px] bg-[var(--color-surface-soft)] px-4 py-3">
                <input
                  className="mt-1 size-4 rounded-[4px] border border-[var(--color-border)] text-amber-600 focus:ring-amber-300"
                  type="checkbox"
                  {...register("acceptedTerms")}
                />
                <span className="text-sm leading-6 text-slate-600">
                  I agree to the{" "}
                  <button
                    className="font-medium text-amber-700 hover:text-amber-800"
                    onClick={() => setActiveDocument("terms")}
                    type="button"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    className="font-medium text-amber-700 hover:text-amber-800"
                    onClick={() => setActiveDocument("privacy")}
                    type="button"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
              {errors.acceptedTerms ? (
                <p className="-mt-2 text-xs text-rose-500">{errors.acceptedTerms.message}</p>
              ) : null}

              {mutation.isError ? (
                <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {getErrorMessage(mutation.error)}
                </p>
              ) : null}

              <Button className="mt-2 w-full py-3 text-base" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Creating..." : "Create account"}
              </Button>
            </form>

            <div className="mt-8 border-t border-[var(--color-border)] pt-5">
              <BrandBadge compact />
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <Link className="hover:text-slate-900" to="/privacy">
                  Privacy Policy
                </Link>
                <Link className="hover:text-slate-900" to="/terms">
                  Terms of Service
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-8">
              {sideDocument ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Agreement</p>
                      <h2 className="mt-2 font-display text-4xl font-semibold text-slate-900">{sideDocument.title}</h2>
                    </div>
                    <button
                      aria-label="Close document"
                      className="rounded-[8px] bg-[var(--color-surface-soft)] p-2 text-slate-500 transition hover:text-slate-900"
                      onClick={() => setActiveDocument(null)}
                      type="button"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <div className="mt-6 h-[320px] overflow-y-auto rounded-[8px] bg-[var(--color-surface-soft)] px-5 py-4 sm:h-[420px]">
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{sideDocument.body}</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-4xl font-semibold text-slate-900">After sign up</h2>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {["Create workspace", "Join by code", "Open invite link", "Start scanning"].map((item) => (
                      <div
                        key={item}
                        className="rounded-[8px] bg-[var(--color-surface-soft)] p-5"
                      >
                        <p className="text-lg font-semibold text-slate-900">{item}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card className="flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">Already have an account?</p>
                <p className="text-sm text-slate-500">Go straight to login.</p>
              </div>
              <Link to="/login">
                <Button variant="secondary">Login</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

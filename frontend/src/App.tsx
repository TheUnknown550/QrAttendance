import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/app-shell";
import { OrganizationRoute } from "./components/layout/organization-route";
import { ProtectedRoute } from "./components/layout/protected-route";

const AccountSettingsPage = lazy(() => import("./pages/account-settings-page").then((module) => ({ default: module.AccountSettingsPage })));
const AttendanceReportPage = lazy(() => import("./pages/attendance-report-page").then((module) => ({ default: module.AttendanceReportPage })));
const AttendeeDetailPage = lazy(() => import("./pages/attendee-detail-page").then((module) => ({ default: module.AttendeeDetailPage })));
const AttendeesPage = lazy(() => import("./pages/attendees-page").then((module) => ({ default: module.AttendeesPage })));
const AboutPage = lazy(() => import("./pages/about-page").then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import("./pages/contact-page").then((module) => ({ default: module.ContactPage })));
const DashboardPage = lazy(() => import("./pages/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const DocsPage = lazy(() => import("./pages/docs-page").then((module) => ({ default: module.DocsPage })));
const EventSeriesDetailPage = lazy(() => import("./pages/event-series-detail-page").then((module) => ({ default: module.EventSeriesDetailPage })));
const EventSeriesListPage = lazy(() => import("./pages/event-series-list-page").then((module) => ({ default: module.EventSeriesListPage })));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password-page").then((module) => ({ default: module.ForgotPasswordPage })));
const HelpPage = lazy(() => import("./pages/help-page").then((module) => ({ default: module.HelpPage })));
const InvitePage = lazy(() => import("./pages/invite-page").then((module) => ({ default: module.InvitePage })));
const LandingPage = lazy(() => import("./pages/landing-page").then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import("./pages/login-page").then((module) => ({ default: module.LoginPage })));
const OnboardingPage = lazy(() => import("./pages/onboarding-page").then((module) => ({ default: module.OnboardingPage })));
const OrganizationSettingsPage = lazy(() => import("./pages/organization-settings-page").then((module) => ({ default: module.OrganizationSettingsPage })));
const PrivacyPolicyPage = lazy(() => import("./pages/privacy-policy-page").then((module) => ({ default: module.PrivacyPolicyPage })));
const RegisterPage = lazy(() => import("./pages/register-page").then((module) => ({ default: module.RegisterPage })));
const ReportsPage = lazy(() => import("./pages/reports-page").then((module) => ({ default: module.ReportsPage })));
const ResetPasswordPage = lazy(() => import("./pages/reset-password-page").then((module) => ({ default: module.ResetPasswordPage })));
const ScannerPage = lazy(() => import("./pages/scanner-page").then((module) => ({ default: module.ScannerPage })));
const SessionDetailPage = lazy(() => import("./pages/session-detail-page").then((module) => ({ default: module.SessionDetailPage })));
const SessionsManagementPage = lazy(() => import("./pages/sessions-management-page").then((module) => ({ default: module.SessionsManagementPage })));
const TermsOfServicePage = lazy(() => import("./pages/terms-of-service-page").then((module) => ({ default: module.TermsOfServicePage })));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/scan/:token" element={<ScannerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="settings/account" element={<AccountSettingsPage />} />
            <Route element={<OrganizationRoute />}>
              <Route index element={<DashboardPage />} />
              <Route path="settings/organization" element={<OrganizationSettingsPage />} />
              <Route path="event-series" element={<EventSeriesListPage />} />
              <Route path="event-series/:id" element={<EventSeriesDetailPage />} />
              <Route path="event-series/:id/sessions" element={<SessionsManagementPage />} />
              <Route path="event-series/:id/sessions/:sessionId" element={<SessionDetailPage />} />
              <Route path="attendees" element={<AttendeesPage />} />
              <Route path="attendees/:id" element={<AttendeeDetailPage />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/event-series/:id" element={<AttendanceReportPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;

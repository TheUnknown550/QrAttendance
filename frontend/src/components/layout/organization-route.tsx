import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export function OrganizationRoute() {
  const location = useLocation();
  const { auth } = useAuth();

  if (!auth?.activeOrganizationId) {
    return <Navigate replace state={{ from: location }} to="/app/onboarding" />;
  }

  return <Outlet />;
}

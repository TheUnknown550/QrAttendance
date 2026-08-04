import { Router } from "express";
import { env } from "../../config/env";
import { requireTrustedOrigin } from "../../middleware/csrf";
import { createRateLimit } from "../../middleware/rate-limit";
import { requireAuth } from "../../middleware/auth";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  refreshAuth,
  register,
  resetPassword,
  switchOrganization,
  updateAccount,
} from "./auth.controller";

const authRouter = Router();
const authRateLimit = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: "Too many authentication requests. Please try again shortly.",
  keyPrefix: "auth",
});

authRouter.post("/login", authRateLimit, login);
authRouter.post("/register", register);
authRouter.post("/refresh", requireTrustedOrigin, authRateLimit, refreshAuth);
authRouter.post("/logout", requireTrustedOrigin, logout);
authRouter.post("/forgot-password", authRateLimit, forgotPassword);
authRouter.post("/reset-password", authRateLimit, resetPassword);
authRouter.get("/me", requireAuth, getMe);
authRouter.post("/switch-organization", requireAuth, switchOrganization);
authRouter.patch("/account", requireAuth, updateAccount);
authRouter.post("/change-password", requireAuth, changePassword);

export { authRouter };

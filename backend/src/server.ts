import { env } from "./config/env";
import { app } from "./app";
import { prisma } from "./lib/prisma";
import { deleteExpiredRefreshSessions } from "./modules/auth/auth.session";
import { runOrganizationCleanup } from "./modules/organizations/organizations.cleanup";

async function start() {
  await prisma.$connect();
  await runOrganizationCleanup();
  await deleteExpiredRefreshSessions();

  const cleanupInterval = setInterval(() => {
    void runOrganizationCleanup().catch((error) => {
      console.error("Organization cleanup failed", error);
    });
  }, env.ORGANIZATION_CLEANUP_INTERVAL_MINUTES * 60 * 1000);
  const refreshCleanupInterval = setInterval(() => {
    void deleteExpiredRefreshSessions().catch((error) => {
      console.error("Refresh session cleanup failed", error);
    });
  }, 60 * 60 * 1000);

  async function shutdown() {
    clearInterval(cleanupInterval);
    clearInterval(refreshCleanupInterval);
    await prisma.$disconnect();
    process.exit(0);
  }

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  app.listen(env.PORT, () => {
    console.log(`Backend listening on http://localhost:${env.PORT}`);
  });
}

start().catch(async (error) => {
  console.error("Failed to start backend", error);
  await prisma.$disconnect();
  process.exit(1);
});

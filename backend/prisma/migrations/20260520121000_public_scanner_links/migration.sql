ALTER TABLE "event_sessions" ADD COLUMN "publicScanToken" TEXT;

CREATE UNIQUE INDEX "event_sessions_publicScanToken_key" ON "event_sessions"("publicScanToken");

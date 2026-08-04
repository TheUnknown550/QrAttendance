import { randomBytes } from "node:crypto";

export function generateQrToken() {
  return randomBytes(24).toString("hex");
}

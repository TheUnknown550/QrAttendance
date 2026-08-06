import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

export type QrPlacementTemplate = {
  imageUrl: string | null;
  canvasWidth: number;
  canvasHeight: number;
  qrX: number;
  qrY: number;
  qrSize: number;
};

export async function generateQrPngBuffer(token: string) {
  return QRCode.toBuffer(token, {
    type: "png",
    width: 480,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

export async function generateAttendeeQrAttachment(token: string, template: QrPlacementTemplate) {
  if (!template.imageUrl) {
    const buffer = await generateQrPngBuffer(token);
    return { buffer, width: 480, height: 480 };
  }

  const backgroundPath = path.resolve(process.cwd(), template.imageUrl.replace(/^\/+/, ""));
  const qrBuffer = await QRCode.toBuffer(token, {
    type: "png",
    width: template.qrSize,
    margin: 0,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  const buffer = await sharp(backgroundPath)
    .resize(template.canvasWidth, template.canvasHeight, { fit: "cover" })
    .composite([{ input: qrBuffer, left: Math.round(template.qrX), top: Math.round(template.qrY) }])
    .png()
    .toBuffer();

  return { buffer, width: template.canvasWidth, height: template.canvasHeight };
}

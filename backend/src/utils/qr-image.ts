import QRCode from "qrcode";

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

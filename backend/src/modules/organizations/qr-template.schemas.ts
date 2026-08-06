import { z } from "zod";
import { QR_TEMPLATE_CANVAS_HEIGHT, QR_TEMPLATE_CANVAS_WIDTH } from "./qr-template.constants";

export const updateQrTemplateSchema = z
  .object({
    qrX: z.coerce.number().int().min(0),
    qrY: z.coerce.number().int().min(0),
    qrSize: z.coerce.number().int().min(40),
  })
  .refine((value) => value.qrX + value.qrSize <= QR_TEMPLATE_CANVAS_WIDTH, {
    message: `QR box must stay within the ${QR_TEMPLATE_CANVAS_WIDTH}px canvas width`,
    path: ["qrX"],
  })
  .refine((value) => value.qrY + value.qrSize <= QR_TEMPLATE_CANVAS_HEIGHT, {
    message: `QR box must stay within the ${QR_TEMPLATE_CANVAS_HEIGHT}px canvas height`,
    path: ["qrY"],
  });

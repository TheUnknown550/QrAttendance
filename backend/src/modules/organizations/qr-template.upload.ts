import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { ApiError } from "../../utils/api-error";
import { QR_TEMPLATE_CANVAS_HEIGHT, QR_TEMPLATE_CANVAS_WIDTH } from "./qr-template.constants";

const uploadRootDir = path.join(process.cwd(), "uploads");
const maxUploadSizeBytes = 5 * 1024 * 1024;
const maxImagePixels = 16_777_216;

const browserMimeTypeAllowList = new Set(["image/jpeg", "image/png", "image/webp"]);

export const qrTemplateImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeBytes,
  },
  fileFilter: (_request, file, callback) => {
    if (!browserMimeTypeAllowList.has(file.mimetype)) {
      callback(new ApiError(400, "Only JPEG, PNG, and WebP images are allowed"));
      return;
    }

    callback(null, true);
  },
});

function slugifySegment(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "unknown";
}

export async function saveQrTemplateImage({
  tenantName,
  file,
}: {
  tenantName: string;
  file: Express.Multer.File;
}) {
  let image = sharp(file.buffer, {
    failOn: "error",
    limitInputPixels: maxImagePixels,
  });

  try {
    await image.metadata();
  } catch {
    throw new ApiError(400, "Uploaded file is not a valid image");
  }

  image = image
    .rotate()
    .resize(QR_TEMPLATE_CANVAS_WIDTH, QR_TEMPLATE_CANVAS_HEIGHT, { fit: "cover" });

  const buffer = await image.png({ compressionLevel: 9 }).toBuffer();

  const organizationSegment = slugifySegment(tenantName);
  const filename = `qr-template-${randomUUID()}.png`;
  const relativeDirectory = path.join(organizationSegment, "qr-template");
  const relativePath = path.join(relativeDirectory, filename);
  const absoluteDirectory = path.join(uploadRootDir, relativeDirectory);
  const absolutePath = path.join(uploadRootDir, relativePath);

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    publicUrl: `/${path.posix.join("uploads", organizationSegment, "qr-template", filename)}`,
    absolutePath,
  };
}

export async function removeStoredQrTemplateImage(imageUrl?: string | null) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
    return;
  }

  const relativePath = imageUrl.replace(/^\/+/, "");
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const normalizedRoot = path.resolve(uploadRootDir);

  if (!absolutePath.startsWith(normalizedRoot)) {
    return;
  }

  try {
    await unlink(absolutePath);
  } catch {
    // Ignore cleanup errors for deleted files.
  }
}

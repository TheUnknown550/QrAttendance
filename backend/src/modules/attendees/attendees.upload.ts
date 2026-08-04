import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { ApiError } from "../../utils/api-error";

const uploadRootDir = path.join(process.cwd(), "uploads");
const maxUploadSizeBytes = 5 * 1024 * 1024;
const maxImageDimension = 4096;
const maxImagePixels = 16_777_216;

type SupportedImageFormat = "jpeg" | "png" | "webp";

type SaveAttendeeImageInput = {
  attendeeName: string;
  organizationName: string;
  file?: Express.Multer.File | null;
};

const browserMimeTypeAllowList = new Set(["image/jpeg", "image/png", "image/webp"]);

const formatToExtension: Record<SupportedImageFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

export const attendeeImageUpload = multer({
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

async function normalizeImageBuffer(file: Express.Multer.File) {
  let image = sharp(file.buffer, {
    failOn: "error",
    limitInputPixels: maxImagePixels,
  });

  let metadata: sharp.Metadata;

  try {
    metadata = await image.metadata();
  } catch {
    throw new ApiError(400, "Uploaded file is not a valid image");
  }

  const format = metadata.format;

  if (format !== "jpeg" && format !== "png" && format !== "webp") {
    throw new ApiError(400, "Only JPEG, PNG, and WebP images are allowed");
  }

  if (!metadata.width || !metadata.height) {
    throw new ApiError(400, "Image dimensions could not be detected");
  }

  if (metadata.width > maxImageDimension || metadata.height > maxImageDimension) {
    throw new ApiError(400, `Image dimensions must be ${maxImageDimension}px or smaller`);
  }

  image = image.rotate();

  if (format === "jpeg") {
    return {
      buffer: await image.jpeg({ quality: 88, mozjpeg: true }).toBuffer(),
      format,
    };
  }

  if (format === "png") {
    return {
      buffer: await image.png({ compressionLevel: 9, palette: true }).toBuffer(),
      format,
    };
  }

  return {
    buffer: await image.webp({ quality: 88 }).toBuffer(),
    format,
  };
}

export async function saveAttendeeImage({
  attendeeName,
  organizationName,
  file,
}: SaveAttendeeImageInput) {
  if (!file) {
    return null;
  }

  const normalizedImage = await normalizeImageBuffer(file);
  const organizationSegment = slugifySegment(organizationName);
  const attendeeSegment = slugifySegment(attendeeName);
  const filename = `${attendeeSegment}-${randomUUID()}.${formatToExtension[normalizedImage.format]}`;
  const relativeDirectory = path.join(organizationSegment, attendeeSegment);
  const relativePath = path.join(relativeDirectory, filename);
  const absoluteDirectory = path.join(uploadRootDir, relativeDirectory);
  const absolutePath = path.join(uploadRootDir, relativePath);

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absolutePath, normalizedImage.buffer);

  return {
    filename,
    publicUrl: `/${path.posix.join("uploads", organizationSegment, attendeeSegment, filename)}`,
    absolutePath,
  };
}

export async function removeStoredAttendeeImage(imageUrl?: string | null) {
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

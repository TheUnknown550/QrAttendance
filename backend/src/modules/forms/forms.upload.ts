import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { ApiError } from "../../utils/api-error";

const uploadRootDir = path.join(process.cwd(), "uploads");
const formsUploadDir = path.join(uploadRootDir, "forms");
const maxUploadSizeBytes = 5 * 1024 * 1024;
const maxImagePixels = 16_777_216;
const maxOutputWidth = 1600;

const browserMimeTypeAllowList = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const formImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeBytes,
  },
  fileFilter: (_request, file, callback) => {
    if (!browserMimeTypeAllowList.has(file.mimetype)) {
      callback(new ApiError(400, "Only JPEG, PNG, WebP, and GIF images are allowed"));
      return;
    }

    callback(null, true);
  },
});

/**
 * Re-encodes the upload as WebP (stripping metadata and anything that is not
 * pixel data) and stores it under uploads/forms/<formId>/.
 */
export async function saveFormImage(formId: string, file: Express.Multer.File) {
  const image = sharp(file.buffer, {
    failOn: "error",
    limitInputPixels: maxImagePixels,
  });

  try {
    await image.metadata();
  } catch {
    throw new ApiError(400, "Uploaded file is not a valid image");
  }

  const buffer = await image
    .rotate()
    .resize({ width: maxOutputWidth, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const filename = `${randomUUID()}.webp`;
  const directory = path.join(formsUploadDir, formId);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);

  return `/${path.posix.join("uploads", "forms", formId, filename)}`;
}

export async function removeFormImages(formId: string) {
  const directory = path.resolve(formsUploadDir, formId);

  if (!directory.startsWith(path.resolve(formsUploadDir) + path.sep)) {
    return;
  }

  try {
    await rm(directory, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors for deleted forms.
  }
}

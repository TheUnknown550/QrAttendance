import { randomUUID } from "node:crypto";
import { mkdir, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
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

/** Re-encodes an upload as WebP, stripping metadata and anything that is not pixel data. */
async function encodeWebp(file: Express.Multer.File, maxWidth: number) {
  const image = sharp(file.buffer, {
    failOn: "error",
    limitInputPixels: maxImagePixels,
  });

  try {
    await image.metadata();
  } catch {
    throw new ApiError(400, "Uploaded file is not a valid image");
  }

  return image.rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
}

async function writeUpload(segments: string[], buffer: Buffer) {
  const filename = `${randomUUID()}.webp`;
  const directory = path.join(formsUploadDir, ...segments);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);

  return `/${path.posix.join("uploads", "forms", ...segments, filename)}`;
}

/** Stores a design image (header, logo, question image) under uploads/forms/<formId>/. */
export async function saveFormImage(formId: string, file: Express.Multer.File) {
  return writeUpload([formId], await encodeWebp(file, maxOutputWidth));
}

const responsePhotoMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxResponsePhotoWidth = 1200;
const maxResponsePhotos = 10;

const responsePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeBytes,
    files: maxResponsePhotos,
    fields: 20,
  },
  fileFilter: (_request, file, callback) => {
    if (!responsePhotoMimeTypes.has(file.mimetype)) {
      callback(new ApiError(400, "Photos must be JPEG, PNG, or WebP images"));
      return;
    }

    callback(null, true);
  },
});

/** Accepts the photos sent with a public form submission (one per photo question). */
export function formResponsePhotoUpload(request: Request, response: Response, next: NextFunction) {
  responsePhotoUpload.any()(request, response, (error?: unknown) => {
    if (error instanceof multer.MulterError) {
      next(
        new ApiError(
          400,
          error.code === "LIMIT_FILE_SIZE" ? "Each photo must be 5 MB or smaller" : "The photos could not be uploaded",
        ),
      );
      return;
    }

    next(error);
  });
}

/** Stores a respondent's photo under uploads/forms/<formId>/responses/ (removed with the form). */
export async function saveFormResponsePhoto(formId: string, file: Express.Multer.File) {
  return writeUpload([formId, "responses"], await encodeWebp(file, maxResponsePhotoWidth));
}

/** Deletes one respondent photo, only if it really is inside this form's responses folder. */
export async function removeFormResponsePhoto(formId: string, url: string | null | undefined) {
  const prefix = `/uploads/forms/${formId}/responses/`;
  if (!url || !url.startsWith(prefix) || !/^[a-z0-9-]+\.webp$/i.test(url.slice(prefix.length))) {
    return;
  }

  try {
    await unlink(path.join(formsUploadDir, formId, "responses", url.slice(prefix.length)));
  } catch {
    // Ignore cleanup errors for files that are already gone.
  }
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

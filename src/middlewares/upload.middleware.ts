import type { Request } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

function ensureDirectory(relativeDir: string) {
  fs.mkdirSync(path.join(uploadsRoot, relativeDir), { recursive: true });
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function createStorage(relativeDir: string) {
  ensureDirectory(relativeDir);

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, path.join(uploadsRoot, relativeDir));
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname) || ".jpg";
      const baseName = path.basename(file.originalname, extension);
      const safeBaseName = sanitizeFileName(baseName) || "image";
      callback(
        null,
        `${Date.now()}-${safeBaseName}${extension.toLowerCase()}`,
      );
    },
  });
}

function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Only image uploads are allowed"));
}

const maxUploadSizeBytes = 10 * 1024 * 1024;

function createImageUpload(relativeDir: string) {
  return multer({
    storage: createStorage(relativeDir),
    limits: {
      fileSize: maxUploadSizeBytes,
    },
    fileFilter: imageFileFilter,
  });
}

export const profileImageUpload = createImageUpload("profile");
export const postImageUpload = createImageUpload(path.join("posts", "images"));

export function toUploadPath(
  file: Express.Multer.File | undefined,
  relativeDir: string,
) {
  if (!file) {
    return undefined;
  }

  return path.posix.join(
    "uploads",
    relativeDir.split(path.sep).join(path.posix.sep),
    file.filename,
  );
}

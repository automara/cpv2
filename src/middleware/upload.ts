import multer from "multer";
import path from "path";

/**
 * File upload configuration using multer
 *
 * Storage: Memory (files stored in RAM, then uploaded to Supabase)
 * Max file size: 10MB (markdown files should be much smaller)
 */

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "text/markdown",
  "text/plain",
  "application/octet-stream", // Some browsers send .md as this
];

const ALLOWED_EXTENSIONS = [".md", ".markdown", ".txt"];

/**
 * File filter to validate uploads
 */
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check MIME type
  const isMimeTypeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtensionValid = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeTypeValid || isExtensionValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      )
    );
  }
};

/**
 * Multer configuration for markdown file uploads
 */
export const uploadMarkdown = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1, // Single file upload
  },
  fileFilter,
});

/**
 * Multer configuration for multiple file uploads
 */
export const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // Max 5 files
  },
  fileFilter,
});

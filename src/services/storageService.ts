import { supabase } from "../lib/supabase.js";

/**
 * Storage bucket name for module files
 */
const MODULES_BUCKET = "modules";

/**
 * File upload result
 */
export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload markdown file to Supabase Storage
 *
 * File path structure: {module_id}/{version}/content.md
 */
export async function uploadMarkdownFile(
  moduleId: string,
  version: number,
  content: string
): Promise<UploadResult> {
  const filePath = `${moduleId}/${version}/content.md`;

  // Upload as text file
  const { data, error } = await supabase.storage
    .from(MODULES_BUCKET)
    .upload(filePath, content, {
      contentType: "text/markdown",
      upsert: true, // Allow overwriting
    });

  if (error) {
    throw new Error(`Failed to upload markdown: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(MODULES_BUCKET).getPublicUrl(filePath);

  console.log(`✅ Uploaded markdown: ${filePath}`);

  return {
    path: data.path,
    publicUrl,
  };
}

/**
 * Upload any file to Supabase Storage
 *
 * Generic upload for thumbnails, PDFs, etc.
 */
export async function uploadFile(
  moduleId: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const filePath = `${moduleId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(MODULES_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MODULES_BUCKET).getPublicUrl(filePath);

  console.log(`✅ Uploaded file: ${filePath}`);

  return {
    path: data.path,
    publicUrl,
  };
}

/**
 * Download markdown file from storage
 */
export async function downloadMarkdownFile(
  moduleId: string,
  version: number
): Promise<string> {
  const filePath = `${moduleId}/${version}/content.md`;

  const { data, error } = await supabase.storage
    .from(MODULES_BUCKET)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download markdown: ${error.message}`);
  }

  const content = await data.text();
  return content;
}

/**
 * Delete all files for a module
 */
export async function deleteModuleFiles(moduleId: string): Promise<void> {
  // List all files for this module
  const { data: files, error: listError } = await supabase.storage
    .from(MODULES_BUCKET)
    .list(moduleId);

  if (listError) {
    throw new Error(`Failed to list module files: ${listError.message}`);
  }

  if (!files || files.length === 0) {
    console.log(`No files to delete for module ${moduleId}`);
    return;
  }

  // Delete all files
  const filePaths = files.map((file) => `${moduleId}/${file.name}`);

  const { error: deleteError } = await supabase.storage
    .from(MODULES_BUCKET)
    .remove(filePaths);

  if (deleteError) {
    throw new Error(`Failed to delete module files: ${deleteError.message}`);
  }

  console.log(`✅ Deleted ${filePaths.length} files for module ${moduleId}`);
}

/**
 * Delete a specific file
 */
export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(MODULES_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }

  console.log(`✅ Deleted file: ${filePath}`);
}

/**
 * Get public URL for a file (without downloading)
 */
export function getPublicUrl(filePath: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(MODULES_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * List all files for a module
 */
export async function listModuleFiles(moduleId: string): Promise<
  Array<{
    name: string;
    path: string;
    publicUrl: string;
    size: number;
    created_at: string;
  }>
> {
  const { data: files, error } = await supabase.storage
    .from(MODULES_BUCKET)
    .list(moduleId, {
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  if (!files) {
    return [];
  }

  return files.map((file) => ({
    name: file.name,
    path: `${moduleId}/${file.name}`,
    publicUrl: getPublicUrl(`${moduleId}/${file.name}`),
    size: file.metadata?.size || 0,
    created_at: file.created_at,
  }));
}

/**
 * Check if storage bucket exists and is accessible
 */
export async function checkStorageHealth(): Promise<{
  accessible: boolean;
  error?: string;
}> {
  try {
    // Try to list files in the bucket
    const { error } = await supabase.storage.from(MODULES_BUCKET).list("", {
      limit: 1,
    });

    if (error) {
      return {
        accessible: false,
        error: error.message,
      };
    }

    return {
      accessible: true,
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

import express, { Request, Response } from "express";
import { z } from "zod";
import {
  createModule,
  getModuleById,
  getModuleBySlug,
  listModules,
  updateModule,
  deleteModule,
  semanticSearch,
  getModuleVersions,
  getModuleStats,
  CreateModuleInput,
  UpdateModuleInput,
  ModuleSearchFilters,
  SemanticSearchInput,
} from "../services/moduleService.js";
import {
  uploadMarkdownFile,
  downloadMarkdownFile,
  listModuleFiles,
} from "../services/storageService.js";
import { uploadMarkdown } from "../middleware/upload.js";

const router = express.Router();

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const CreateModuleSchema = z.object({
  title: z.string().min(1).max(200),
  markdownContent: z.string().min(10),
  owner: z.string().optional(),
  source_url: z.string().url().optional(),
  source_label: z.string().optional(),
});

const UpdateModuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary_short: z.string().optional(),
  summary_medium: z.string().optional(),
  summary_long: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  seo_keywords: z.array(z.string()).optional(),
  schema_json: z.record(z.string(), z.any()).optional(),
  image_prompt: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  source_url: z.string().url().optional(),
  source_label: z.string().optional(),
});

const SemanticSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional(),
  threshold: z.number().min(0).max(1).optional(),
});

// ============================================================
// POST /api/modules/create - Create a new module
// ============================================================
router.post("/create", async (req: Request, res: Response) => {
  try {
    // Validate input
    const input = CreateModuleSchema.parse(req.body);

    // Create module (includes AI processing)
    const result = await createModule(input as CreateModuleInput);

    res.status(201).json({
      success: true,
      message: "Module created successfully",
      data: {
        module: result.module,
        ai_metadata: {
          quality_score: result.aiResult.quality_score,
          processing_time_ms: result.aiResult.processing_time_ms,
          estimated_cost_usd: result.aiResult.estimated_cost_usd,
        },
      },
    });
  } catch (error) {
    console.error("Error creating module:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create module",
    });
  }
});

// ============================================================
// GET /api/modules - List all modules with filters
// ============================================================
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters: ModuleSearchFilters = {
      category: req.query.category as string,
      tags: req.query.tags
        ? Array.isArray(req.query.tags)
          ? (req.query.tags as string[])
          : [req.query.tags as string]
        : undefined,
      status: req.query.status as string,
      owner: req.query.owner as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset
        ? parseInt(req.query.offset as string)
        : undefined,
    };

    const result = await listModules(filters);

    res.json({
      success: true,
      data: {
        modules: result.modules,
        pagination: {
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error listing modules:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to list modules",
    });
  }
});

// ============================================================
// GET /api/modules/stats - Get module statistics
// ============================================================
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getModuleStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting module stats:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get module stats",
    });
  }
});

// ============================================================
// POST /api/modules/search - Semantic search
// ============================================================
router.post("/search", async (req: Request, res: Response) => {
  try {
    const input = SemanticSearchSchema.parse(req.body);

    const modules = await semanticSearch(input as SemanticSearchInput);

    res.json({
      success: true,
      data: {
        query: input.query,
        results: modules,
        count: modules.length,
      },
    });
  } catch (error) {
    console.error("Error searching modules:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    });
  }
});

// ============================================================
// GET /api/modules/:identifier - Get module by ID or slug
// ============================================================
router.get("/:identifier", async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    // Try to get by ID first (UUID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(identifier);

    const module = isUUID
      ? await getModuleById(identifier)
      : await getModuleBySlug(identifier);

    if (!module) {
      res.status(404).json({
        success: false,
        error: "Module not found",
      });
      return;
    }

    res.json({
      success: true,
      data: module,
    });
  } catch (error) {
    console.error("Error getting module:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get module",
    });
  }
});

// ============================================================
// GET /api/modules/:id/versions - Get module version history
// ============================================================
router.get("/:id/versions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const versions = await getModuleVersions(id);

    res.json({
      success: true,
      data: {
        module_id: id,
        versions,
      },
    });
  } catch (error) {
    console.error("Error getting module versions:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get versions",
    });
  }
});

// ============================================================
// PATCH /api/modules/:id - Update module
// ============================================================
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate input
    const updates = UpdateModuleSchema.parse(req.body);

    // Update module
    const module = await updateModule(id, updates as UpdateModuleInput);

    res.json({
      success: true,
      message: "Module updated successfully",
      data: module,
    });
  } catch (error) {
    console.error("Error updating module:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update module",
    });
  }
});

// ============================================================
// DELETE /api/modules/:id - Delete module
// ============================================================
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteModule(id);

    res.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete module",
    });
  }
});

// ============================================================
// POST /api/modules/upload - Upload markdown file
// ============================================================
router.post(
  "/upload",
  uploadMarkdown.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
        return;
      }

      // Get file content
      const markdownContent = req.file.buffer.toString("utf-8");

      // Get metadata from form data
      const title = req.body.title || req.file.originalname.replace(/\.(md|markdown|txt)$/i, "");
      const owner = req.body.owner;
      const source_url = req.body.source_url;
      const source_label = req.body.source_label;

      // Create module with AI processing
      const result = await createModule({
        title,
        markdownContent,
        owner,
        source_url,
        source_label,
      });

      // Upload original file to storage
      await uploadMarkdownFile(
        result.module.id,
        1,
        markdownContent
      );

      res.status(201).json({
        success: true,
        message: "File uploaded and module created successfully",
        data: {
          module: result.module,
          ai_metadata: {
            quality_score: result.aiResult.quality_score,
            processing_time_ms: result.aiResult.processing_time_ms,
            estimated_cost_usd: result.aiResult.estimated_cost_usd,
          },
        },
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      });
    }
  }
);

// ============================================================
// GET /api/modules/:id/download - Download module markdown
// ============================================================
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const version = req.query.version
      ? parseInt(req.query.version as string)
      : 1;

    // Get module info
    const module = await getModuleById(id);
    if (!module) {
      res.status(404).json({
        success: false,
        error: "Module not found",
      });
      return;
    }

    // Download markdown file
    const content = await downloadMarkdownFile(id, version);

    // Set headers for file download
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${module.slug}.md"`
    );

    res.send(content);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to download file",
    });
  }
});

// ============================================================
// GET /api/modules/:id/files - List all files for a module
// ============================================================
router.get("/:id/files", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const files = await listModuleFiles(id);

    res.json({
      success: true,
      data: {
        module_id: id,
        files,
      },
    });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to list files",
    });
  }
});

export default router;

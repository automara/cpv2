import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  syncModuleToWebflow,
  batchSyncModulesToWebflow,
  checkWebflowHealth,
  isWebflowConfigured,
} from "../services/webflowService.js";
import {
  getModuleById,
  listModules,
  ModuleSearchFilters,
} from "../services/moduleService.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * Validation schemas
 */
const SyncOptionsSchema = z.object({
  autoPublish: z.boolean().optional().default(true),
  forceCreate: z.boolean().optional().default(false),
});

const BatchSyncOptionsSchema = z.object({
  autoPublish: z.boolean().optional().default(true),
  delayBetweenRequests: z.number().min(0).max(5000).optional().default(500),
  category: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
});

/**
 * GET /api/webflow/health
 *
 * Check Webflow integration health
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const health = await checkWebflowHealth();
    res.json(health);
  } catch (error) {
    console.error("Webflow health check error:", error);
    res.status(500).json({
      configured: isWebflowConfigured(),
      accessible: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/webflow/sync/:id
 *
 * Sync a single module to Webflow CMS
 *
 * Body:
 * - autoPublish (boolean, optional): Auto-publish if status is "published" (default: true)
 * - forceCreate (boolean, optional): Force create new item even if webflow_id exists (default: false)
 */
router.post("/sync/:id", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const options = SyncOptionsSchema.parse(req.body);
    const moduleId = req.params.id;

    // Get module
    const module = await getModuleById(moduleId);
    if (!module) {
      res.status(404).json({
        error: "Module not found",
        moduleId,
      });
      return;
    }

    // Sync to Webflow
    const result = await syncModuleToWebflow(module, options);

    // Update module with webflow_id if created/updated
    if (result.success && result.webflowId) {
      await supabase
        .from("modules")
        .update({ webflow_id: result.webflowId })
        .eq("id", module.id);
    }

    // Return result
    if (result.success) {
      res.json({
        success: true,
        module: {
          id: module.id,
          title: module.title,
          slug: module.slug,
        },
        webflow: {
          id: result.webflowId,
          action: result.action,
        },
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        module: {
          id: module.id,
          title: module.title,
        },
        error: result.error || result.message,
      });
    }
  } catch (error) {
    console.error("Webflow sync error:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        issues: error.issues,
      });
      return;
    }

    res.status(500).json({
      error: "Failed to sync module to Webflow",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/webflow/sync-batch
 *
 * Batch sync multiple modules to Webflow CMS
 *
 * Body:
 * - autoPublish (boolean, optional): Auto-publish if status is "published" (default: true)
 * - delayBetweenRequests (number, optional): Delay between requests in ms (default: 500, max: 5000)
 * - category (string, optional): Filter by category
 * - status (string, optional): Filter by status
 * - limit (number, optional): Max number of modules to sync (default: all, max: 100)
 */
router.post("/sync-batch", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const options = BatchSyncOptionsSchema.parse(req.body);

    // Build filters
    const filters: ModuleSearchFilters = {
      category: options.category,
      status: options.status,
      limit: options.limit,
    };

    // Get modules
    const { modules } = await listModules(filters);

    if (modules.length === 0) {
      res.json({
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
        message: "No modules found matching filters",
      });
      return;
    }

    // Batch sync
    const result = await batchSyncModulesToWebflow(modules, {
      autoPublish: options.autoPublish,
      delayBetweenRequests: options.delayBetweenRequests,
    });

    // Update modules with webflow_ids
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const syncResult = result.results[i];

      if (syncResult.success && syncResult.webflowId) {
        await supabase
          .from("modules")
          .update({ webflow_id: syncResult.webflowId })
          .eq("id", module.id);
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Webflow batch sync error:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        issues: error.issues,
      });
      return;
    }

    res.status(500).json({
      error: "Failed to batch sync modules to Webflow",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/webflow/status/:id
 *
 * Get Webflow sync status for a module
 */
router.get("/status/:id", async (req: Request, res: Response) => {
  try {
    const moduleId = req.params.id;

    // Get module
    const module = await getModuleById(moduleId);
    if (!module) {
      res.status(404).json({
        error: "Module not found",
        moduleId,
      });
      return;
    }

    res.json({
      module: {
        id: module.id,
        title: module.title,
        slug: module.slug,
        status: module.status,
      },
      webflow: {
        synced: !!module.webflow_id,
        webflowId: module.webflow_id || null,
      },
    });
  } catch (error) {
    console.error("Webflow status error:", error);
    res.status(500).json({
      error: "Failed to get Webflow status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/webflow/webhook
 *
 * Handle webhooks from Webflow (for bi-directional sync)
 * Note: This is a placeholder for future implementation
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    console.log("Webflow webhook received:", req.body);

    // TODO: Implement webhook handling
    // - Verify webhook signature
    // - Parse webhook payload
    // - Update local module if changed in Webflow
    // - Handle deletions

    res.json({
      message: "Webhook received (not yet implemented)",
      received: true,
    });
  } catch (error) {
    console.error("Webflow webhook error:", error);
    res.status(500).json({
      error: "Failed to process webhook",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

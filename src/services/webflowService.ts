import { Module } from "../lib/supabase.js";

/**
 * Webflow API Configuration
 */
const WEBFLOW_API_URL = "https://api.webflow.com/v2";
const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;

/**
 * Webflow CMS Item structure
 */
export interface WebflowItem {
  id?: string;
  fieldData: {
    name: string;
    slug: string;
    [key: string]: any;
  };
  isArchived?: boolean;
  isDraft?: boolean;
}

/**
 * Webflow API Response types
 */
export interface WebflowCreateResponse {
  id: string;
  cmsLocaleId: string;
  lastPublished: string | null;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: Record<string, any>;
}

export interface WebflowUpdateResponse extends WebflowCreateResponse {}

export interface WebflowSyncResult {
  success: boolean;
  webflowId?: string;
  action: "created" | "updated" | "skipped" | "error";
  message: string;
  error?: string;
}

/**
 * Check if Webflow integration is configured
 */
export function isWebflowConfigured(): boolean {
  return !!(WEBFLOW_API_TOKEN && WEBFLOW_SITE_ID && WEBFLOW_COLLECTION_ID);
}

/**
 * Check Webflow API health
 */
export async function checkWebflowHealth(): Promise<{
  configured: boolean;
  accessible?: boolean;
  error?: string;
}> {
  if (!isWebflowConfigured()) {
    return {
      configured: false,
      error: "Webflow credentials not configured",
    };
  }

  try {
    // Test API connectivity by fetching collection info
    const response = await fetch(
      `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          "accept-version": "1.0.0",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        configured: true,
        accessible: false,
        error: `API returned ${response.status}: ${error}`,
      };
    }

    return {
      configured: true,
      accessible: true,
    };
  } catch (error) {
    return {
      configured: true,
      accessible: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Map CurrentPrompt Module to Webflow CMS Item
 *
 * This maps our internal module structure to Webflow's expected field structure.
 * Customize this mapping based on your Webflow collection schema.
 */
export function mapModuleToWebflowItem(module: Module): WebflowItem {
  return {
    id: module.webflow_id,
    fieldData: {
      // Core fields (name and slug are typically required)
      name: module.title,
      slug: module.slug,

      // Content fields (customize based on your Webflow collection)
      category: module.category || "Uncategorized",
      tags: module.tags?.join(", ") || "",

      // Summaries
      "summary-short": module.summary_short || "",
      "summary-medium": module.summary_medium || "",
      "summary-long": module.summary_long || "",

      // SEO
      "meta-title": module.meta_title || module.title,
      "meta-description": module.meta_description || module.summary_short || "",
      "seo-keywords": module.seo_keywords?.join(", ") || "",

      // Advanced
      "schema-json": module.schema_json
        ? JSON.stringify(module.schema_json)
        : "",
      "image-prompt": module.image_prompt || "",
      "quality-score": module.quality_score || 0,

      // Source
      "source-url": module.source_url || "",
      "source-label": module.source_label || "",

      // Metadata
      "currentprompt-id": module.id,
      version: module.latest_version || 1,
    },
    isDraft: module.status === "draft",
    isArchived: module.status === "archived",
  };
}

/**
 * Create a new item in Webflow CMS
 */
async function createWebflowItem(
  item: WebflowItem
): Promise<WebflowCreateResponse> {
  if (!isWebflowConfigured()) {
    throw new Error("Webflow is not configured");
  }

  const response = await fetch(
    `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        "Content-Type": "application/json",
        "accept-version": "1.0.0",
      },
      body: JSON.stringify({ fieldData: item.fieldData }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create Webflow item: ${response.status} - ${error}`
    );
  }

  return (await response.json()) as WebflowCreateResponse;
}

/**
 * Update an existing item in Webflow CMS
 */
async function updateWebflowItem(
  itemId: string,
  item: WebflowItem
): Promise<WebflowUpdateResponse> {
  if (!isWebflowConfigured()) {
    throw new Error("Webflow is not configured");
  }

  const response = await fetch(
    `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items/${itemId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        "Content-Type": "application/json",
        "accept-version": "1.0.0",
      },
      body: JSON.stringify({ fieldData: item.fieldData }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to update Webflow item: ${response.status} - ${error}`
    );
  }

  return (await response.json()) as WebflowUpdateResponse;
}

/**
 * Publish a Webflow item (make it live)
 */
async function publishWebflowItem(itemId: string): Promise<void> {
  if (!isWebflowConfigured()) {
    throw new Error("Webflow is not configured");
  }

  const response = await fetch(
    `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items/publish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        "Content-Type": "application/json",
        "accept-version": "1.0.0",
      },
      body: JSON.stringify({ itemIds: [itemId] }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to publish Webflow item: ${response.status} - ${error}`
    );
  }
}

/**
 * Sync a module to Webflow CMS
 *
 * This is the main entry point for syncing a module to Webflow.
 * It will:
 * 1. Check if the module already has a webflow_id (update) or not (create)
 * 2. Map the module to Webflow's field structure
 * 3. Create or update the item in Webflow
 * 4. Optionally publish the item if status is "published"
 * 5. Return the Webflow item ID
 */
export async function syncModuleToWebflow(
  module: Module,
  options: {
    autoPublish?: boolean;
    forceCreate?: boolean;
  } = {}
): Promise<WebflowSyncResult> {
  console.log(`🔄 Syncing module to Webflow: ${module.title}`);

  try {
    // Check if Webflow is configured
    if (!isWebflowConfigured()) {
      return {
        success: false,
        action: "skipped",
        message: "Webflow integration is not configured",
      };
    }

    // Map module to Webflow item
    const webflowItem = mapModuleToWebflowItem(module);

    let result: WebflowCreateResponse | WebflowUpdateResponse;
    let action: "created" | "updated";

    // Determine if we should create or update
    if (module.webflow_id && !options.forceCreate) {
      // Update existing item
      console.log(`  → Updating existing Webflow item: ${module.webflow_id}`);
      result = await updateWebflowItem(module.webflow_id, webflowItem);
      action = "updated";
    } else {
      // Create new item
      console.log(`  → Creating new Webflow item`);
      result = await createWebflowItem(webflowItem);
      action = "created";
    }

    // Publish if status is "published" and autoPublish is enabled
    const shouldPublish =
      (options.autoPublish ?? true) && module.status === "published";
    if (shouldPublish) {
      console.log(`  → Publishing Webflow item: ${result.id}`);
      await publishWebflowItem(result.id);
    }

    console.log(
      `✅ Successfully ${action} Webflow item: ${result.id}${shouldPublish ? " (published)" : " (draft)"}`
    );

    return {
      success: true,
      webflowId: result.id,
      action,
      message: `Module ${action} successfully${shouldPublish ? " and published" : ""}`,
    };
  } catch (error) {
    console.error(`❌ Failed to sync module to Webflow:`, error);
    return {
      success: false,
      action: "error",
      message: "Failed to sync module to Webflow",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch sync multiple modules to Webflow
 *
 * This will sync multiple modules in sequence (not parallel) to avoid
 * rate limiting issues with the Webflow API.
 */
export async function batchSyncModulesToWebflow(
  modules: Module[],
  options: {
    autoPublish?: boolean;
    delayBetweenRequests?: number; // ms
  } = {}
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: WebflowSyncResult[];
}> {
  console.log(`🔄 Batch syncing ${modules.length} modules to Webflow`);

  const results: WebflowSyncResult[] = [];
  const delay = options.delayBetweenRequests ?? 500; // Default 500ms delay

  for (const module of modules) {
    const result = await syncModuleToWebflow(module, {
      autoPublish: options.autoPublish,
    });
    results.push(result);

    // Add delay between requests to avoid rate limiting
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(
    `✅ Batch sync complete: ${succeeded} succeeded, ${failed} failed`
  );

  return {
    total: modules.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * Delete a module from Webflow CMS
 */
export async function deleteWebflowItem(webflowId: string): Promise<void> {
  if (!isWebflowConfigured()) {
    throw new Error("Webflow is not configured");
  }

  const response = await fetch(
    `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items/${webflowId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        "accept-version": "1.0.0",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to delete Webflow item: ${response.status} - ${error}`
    );
  }

  console.log(`🗑️  Deleted Webflow item: ${webflowId}`);
}

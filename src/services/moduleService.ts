import { supabase, Module, ModuleVersion } from "../lib/supabase.js";
import { processMarkdownWithAI, AIPipelineResult } from "./aiPipeline.js";

/**
 * Module creation input (from user)
 */
export interface CreateModuleInput {
  title: string;
  markdownContent: string;
  owner?: string;
  source_url?: string;
  source_label?: string;
}

/**
 * Module update input
 */
export interface UpdateModuleInput {
  title?: string;
  category?: string;
  tags?: string[];
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;
  meta_title?: string;
  meta_description?: string;
  seo_keywords?: string[];
  schema_json?: Record<string, any>;
  image_prompt?: string;
  status?: string;
  source_url?: string;
  source_label?: string;
  latest_version?: number;
}

/**
 * Module search filters
 */
export interface ModuleSearchFilters {
  category?: string;
  tags?: string[];
  status?: string;
  owner?: string;
  limit?: number;
  offset?: number;
}

/**
 * Semantic search input
 */
export interface SemanticSearchInput {
  query: string;
  limit?: number;
  threshold?: number;
}

/**
 * Generate a URL-safe slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Create a new module with AI-generated metadata
 *
 * Flow:
 * 1. Process markdown through AI pipeline
 * 2. Check if quality score meets threshold (70+)
 * 3. Generate slug from title
 * 4. Insert module into database
 * 5. Insert embedding into separate table
 * 6. Create initial version record
 */
export async function createModule(
  input: CreateModuleInput
): Promise<{ module: Module; aiResult: AIPipelineResult }> {
  console.log(`📝 Creating module: ${input.title}`);

  // Step 1: Process markdown through AI pipeline
  const aiResult = await processMarkdownWithAI(input.markdownContent);

  // Step 2: Check quality threshold
  if (aiResult.quality_score < 70) {
    throw new Error(
      `Module quality score (${aiResult.quality_score}) is below threshold (70). ` +
        `Validation feedback: ${JSON.stringify(aiResult.validation_report)}`
    );
  }

  // Step 3: Generate slug
  const slug = generateSlug(input.title);

  // Step 4: Insert module
  const moduleData = {
    title: input.title,
    slug,
    category: aiResult.category,
    tags: aiResult.tags,
    summary_short: aiResult.summary_short,
    summary_medium: aiResult.summary_medium,
    summary_long: aiResult.summary_long,
    meta_title: aiResult.meta_title,
    meta_description: aiResult.meta_description,
    seo_keywords: aiResult.seo_keywords.split(",").map((k) => k.trim()),
    schema_json: aiResult.schema_json,
    image_prompt: aiResult.image_prompt,
    quality_score: aiResult.quality_score,
    validation_report: aiResult.validation_report,
    owner: input.owner || "Keith Armstrong",
    source_url: input.source_url,
    source_label: input.source_label,
    latest_version: 1,
    status: "draft",
  };

  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .insert([moduleData])
    .select()
    .single();

  if (moduleError || !module) {
    throw new Error(`Failed to create module: ${moduleError?.message}`);
  }

  console.log(`✅ Module created: ${module.id} (slug: ${module.slug})`);

  // Step 5: Insert embedding
  const { error: embeddingError } = await supabase
    .from("module_embeddings")
    .insert([
      {
        module_id: module.id,
        embedding: aiResult.embedding,
      },
    ]);

  if (embeddingError) {
    console.warn(`⚠️  Failed to insert embedding: ${embeddingError.message}`);
    // Don't fail the whole operation, embeddings can be regenerated
  }

  // Step 6: Create initial version
  const { error: versionError } = await supabase
    .from("module_versions")
    .insert([
      {
        module_id: module.id,
        version: 1,
        changelog: "Initial version",
        file_paths: {},
      },
    ]);

  if (versionError) {
    console.warn(`⚠️  Failed to create version: ${versionError.message}`);
  }

  return { module: module as Module, aiResult };
}

/**
 * Get a module by ID
 */
export async function getModuleById(id: string): Promise<Module | null> {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Failed to get module ${id}:`, error);
    return null;
  }

  return data as Module;
}

/**
 * Get a module by slug
 */
export async function getModuleBySlug(slug: string): Promise<Module | null> {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(`Failed to get module ${slug}:`, error);
    return null;
  }

  return data as Module;
}

/**
 * List modules with optional filters
 */
export async function listModules(
  filters: ModuleSearchFilters = {}
): Promise<{ modules: Module[]; total: number }> {
  let query = supabase.from("modules").select("*", { count: "exact" });

  // Apply filters
  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.owner) {
    query = query.eq("owner", filters.owner);
  }

  // Pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list modules: ${error.message}`);
  }

  return {
    modules: (data as Module[]) || [],
    total: count || 0,
  };
}

/**
 * Update a module
 */
export async function updateModule(
  id: string,
  updates: UpdateModuleInput
): Promise<Module> {
  const { data, error } = await supabase
    .from("modules")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update module: ${error?.message}`);
  }

  console.log(`✅ Module updated: ${id}`);
  return data as Module;
}

/**
 * Delete a module (cascades to versions and embeddings)
 */
export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase.from("modules").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete module: ${error.message}`);
  }

  console.log(`✅ Module deleted: ${id}`);
}

/**
 * Search modules using semantic vector similarity
 *
 * Uses pgvector's cosine similarity search
 */
export async function semanticSearch(
  input: SemanticSearchInput
): Promise<Module[]> {
  // First, generate embedding for the query
  const { generateEmbeddings } = await import("../agents/embeddingsAgent.js");
  const queryEmbedding = await generateEmbeddings(input.query);

  const limit = input.limit || 10;
  const threshold = input.threshold || 0.5;

  // Perform vector similarity search
  // Note: This requires a custom RPC function in Supabase
  const { data, error } = await supabase.rpc("search_modules_by_embedding", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Semantic search failed: ${error.message}`);
  }

  return (data as Module[]) || [];
}

/**
 * Get module versions
 */
export async function getModuleVersions(
  moduleId: string
): Promise<ModuleVersion[]> {
  const { data, error } = await supabase
    .from("module_versions")
    .select("*")
    .eq("module_id", moduleId)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(`Failed to get module versions: ${error.message}`);
  }

  return (data as ModuleVersion[]) || [];
}

/**
 * Create a new version for a module
 */
export async function createModuleVersion(
  moduleId: string,
  changelog?: string,
  filePaths?: Record<string, string>
): Promise<ModuleVersion> {
  // Get current latest version
  const module = await getModuleById(moduleId);
  if (!module) {
    throw new Error(`Module ${moduleId} not found`);
  }

  const newVersion = (module.latest_version || 1) + 1;

  const { data, error } = await supabase
    .from("module_versions")
    .insert([
      {
        module_id: moduleId,
        version: newVersion,
        changelog,
        file_paths: filePaths,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create version: ${error?.message}`);
  }

  // Update module's latest_version
  await updateModule(moduleId, { latest_version: newVersion });

  console.log(`✅ Created version ${newVersion} for module ${moduleId}`);
  return data as ModuleVersion;
}

/**
 * Get statistics about modules
 */
export async function getModuleStats(): Promise<{
  total: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
}> {
  // Total count
  const { count: total } = await supabase
    .from("modules")
    .select("*", { count: "exact", head: true });

  // By category
  const { data: categoryData } = await supabase
    .from("modules")
    .select("category");

  const by_category: Record<string, number> = {};
  categoryData?.forEach((row) => {
    by_category[row.category] = (by_category[row.category] || 0) + 1;
  });

  // By status
  const { data: statusData } = await supabase.from("modules").select("status");

  const by_status: Record<string, number> = {};
  statusData?.forEach((row) => {
    by_status[row.status] = (by_status[row.status] || 0) + 1;
  });

  return {
    total: total || 0,
    by_category,
    by_status,
  };
}

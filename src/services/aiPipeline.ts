import { generateSummaries } from "../agents/summaryAgent.js";
import { generateSEOMetadata } from "../agents/seoAgent.js";
import { categorizeContent } from "../agents/categoryAgent.js";
import { generateTags } from "../agents/tagsAgent.js";
import { generateSchemaOrgData } from "../agents/schemaAgent.js";
import { generateImagePrompt } from "../agents/imagePromptAgent.js";
import { generateEmbeddings } from "../agents/embeddingsAgent.js";
import {
  validateMetadata,
  ValidationResult,
} from "../agents/validatorAgent.js";

/**
 * Result from the AI pipeline
 */
export interface AIPipelineResult {
  // Summaries
  summary_short: string;
  summary_medium: string;
  summary_long: string;

  // SEO
  meta_title: string;
  meta_description: string;
  seo_keywords: string;

  // Categorization
  category: string;
  category_confidence?: number;

  // Tags
  tags: string[];

  // Structured data
  schema_json: Record<string, unknown>;

  // Image
  image_prompt: string;

  // Embeddings
  embedding: number[];

  // Quality assurance
  quality_score: number;
  validation_report: Record<string, unknown>;

  // Metadata
  processing_time_ms: number;
  estimated_cost_usd: number;
}

/**
 * Cost estimates per agent (in USD)
 */
const COST_ESTIMATES = {
  summary: 0.001,
  seo: 0.002,
  category: 0.003,
  tags: 0.003,
  schema: 0.02,
  imagePrompt: 0.01,
  embeddings: 0.013,
  validator: 0.02,
};

/**
 * Main AI Pipeline - Orchestrates all 8 agents in optimized phases
 *
 * Phase 1 (Parallel): Summary, SEO, Category, Tags
 * Phase 2 (Parallel): Schema, Image, Embeddings
 * Phase 3 (Sequential): Validator
 *
 * Total cost: ~$0.05 per module
 */
export async function processMarkdownWithAI(
  markdownContent: string
): Promise<AIPipelineResult> {
  const startTime = Date.now();
  let totalCost = 0;

  console.log("🚀 Starting AI pipeline...");

  try {
    // ============================================================
    // PHASE 1: Basic Metadata (Parallel Execution)
    // ============================================================
    console.log("📊 Phase 1: Generating basic metadata...");
    const phase1Start = Date.now();

    const [summaries, seo, categoryResult, tags] = await Promise.all([
      generateSummaries(markdownContent),
      generateSEOMetadata(markdownContent),
      categorizeContent(markdownContent),
      generateTags(markdownContent),
    ]);

    totalCost +=
      COST_ESTIMATES.summary +
      COST_ESTIMATES.seo +
      COST_ESTIMATES.category +
      COST_ESTIMATES.tags;

    const phase1Time = Date.now() - phase1Start;
    console.log(`✅ Phase 1 complete (${phase1Time}ms)`);
    console.log(`   - Summaries: ✓`);
    console.log(`   - SEO: ✓`);
    console.log(`   - Category: ${categoryResult.category}`);
    console.log(`   - Tags: ${tags.join(", ")}`);

    // ============================================================
    // PHASE 2: Rich Metadata (Parallel Execution)
    // ============================================================
    console.log("🎨 Phase 2: Generating rich metadata...");
    const phase2Start = Date.now();

    const [schema, imagePrompt, embedding] = await Promise.all([
      generateSchemaOrgData(markdownContent),
      generateImagePrompt(markdownContent),
      generateEmbeddings(markdownContent),
    ]);

    totalCost +=
      COST_ESTIMATES.schema +
      COST_ESTIMATES.imagePrompt +
      COST_ESTIMATES.embeddings;

    const phase2Time = Date.now() - phase2Start;
    console.log(`✅ Phase 2 complete (${phase2Time}ms)`);
    console.log(`   - Schema.org: ✓`);
    console.log(`   - Image Prompt: ✓`);
    console.log(`   - Embeddings: ✓ (${embedding.length} dimensions)`);

    // ============================================================
    // PHASE 3: Quality Validation (Sequential)
    // ============================================================
    console.log("🔍 Phase 3: Validating quality...");
    const phase3Start = Date.now();

    const validation = await validateMetadata(markdownContent, {
      summaries,
      seo,
      category: categoryResult,
      tags,
      schema,
      imagePrompt,
    });

    totalCost += COST_ESTIMATES.validator;

    const phase3Time = Date.now() - phase3Start;
    console.log(`✅ Phase 3 complete (${phase3Time}ms)`);
    console.log(
      `   - Quality Score: ${validation.quality_score}/100 ${validation.passed ? "✓ PASSED" : "✗ FAILED"}`
    );

    // ============================================================
    // FINAL RESULT
    // ============================================================
    const totalTime = Date.now() - startTime;

    const result: AIPipelineResult = {
      // Summaries
      summary_short: summaries.summary_short,
      summary_medium: summaries.summary_medium,
      summary_long: summaries.summary_long,

      // SEO
      meta_title: seo.meta_title,
      meta_description: seo.meta_description,
      seo_keywords: seo.seo_keywords,

      // Categorization
      category: categoryResult.category,
      category_confidence: categoryResult.confidence,

      // Tags
      tags,

      // Structured data
      schema_json: schema,

      // Image
      image_prompt: imagePrompt.image_prompt,

      // Embeddings
      embedding,

      // Quality assurance
      quality_score: validation.quality_score,
      validation_report: validation.validation_report as Record<string, unknown>,

      // Metadata
      processing_time_ms: totalTime,
      estimated_cost_usd: totalCost,
    };

    console.log(`\n🎉 AI Pipeline Complete!`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Estimated Cost: $${totalCost.toFixed(4)}`);
    console.log(
      `   Quality: ${validation.quality_score}/100 ${validation.passed ? "✓" : "✗"}`
    );

    if (!validation.passed) {
      console.warn(
        "⚠️  Warning: Content did not pass quality validation threshold (70+)"
      );
      console.warn(
        `   Feedback: ${validation.validation_report.overall_feedback}`
      );
    }

    return result;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ AI Pipeline failed after ${totalTime}ms:`, error);
    throw new Error(
      `AI Pipeline failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Estimate cost for processing markdown content
 * Useful for batch processing cost estimation
 */
export function estimateProcessingCost(contentCount: number): {
  total: number;
  perModule: number;
  breakdown: Record<string, number>;
} {
  const perModuleCost = Object.values(COST_ESTIMATES).reduce(
    (sum, cost) => sum + cost,
    0
  );

  return {
    total: perModuleCost * contentCount,
    perModule: perModuleCost,
    breakdown: COST_ESTIMATES,
  };
}

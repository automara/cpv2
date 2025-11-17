import { describe, it, expect, beforeAll } from "@jest/globals";
import { processMarkdownWithAI, estimateProcessingCost } from "../src/services/aiPipeline";

// Sample markdown content for testing
const SAMPLE_MARKDOWN = `# Introduction to TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

## Key Features

- **Type Safety**: Catch errors at compile time
- **Modern JavaScript**: Use the latest ECMAScript features
- **Tooling**: Enhanced IDE support and autocomplete
- **Scalability**: Perfect for large codebases

## Getting Started

Install TypeScript globally:

\`\`\`bash
npm install -g typescript
\`\`\`

Create your first TypeScript file:

\`\`\`typescript
const greeting: string = "Hello, TypeScript!";
console.log(greeting);
\`\`\`

TypeScript makes JavaScript development more productive and enjoyable!`;

describe("AI Pipeline Integration Tests", () => {
  beforeAll(() => {
    // Ensure environment variables are set
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️  OPENROUTER_API_KEY not set, tests may fail");
    }
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️  OPENAI_API_KEY not set, tests may fail");
    }
  });

  it("should process markdown and return all required fields", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    // Verify all fields are present
    expect(result).toBeDefined();
    expect(result.summary_short).toBeDefined();
    expect(result.summary_medium).toBeDefined();
    expect(result.summary_long).toBeDefined();
    expect(result.meta_title).toBeDefined();
    expect(result.meta_description).toBeDefined();
    expect(result.seo_keywords).toBeDefined();
    expect(result.category).toBeDefined();
    expect(result.tags).toBeDefined();
    expect(result.schema_json).toBeDefined();
    expect(result.image_prompt).toBeDefined();
    expect(result.embedding).toBeDefined();
    expect(result.quality_score).toBeDefined();
    expect(result.validation_report).toBeDefined();
    expect(result.processing_time_ms).toBeDefined();
    expect(result.estimated_cost_usd).toBeDefined();
  }, 60000); // 60 second timeout for API calls

  it("should generate summaries of appropriate lengths", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(result.summary_short.length).toBeGreaterThan(30);
    expect(result.summary_short.length).toBeLessThan(150);

    expect(result.summary_medium.length).toBeGreaterThan(100);
    expect(result.summary_medium.length).toBeLessThan(300);

    expect(result.summary_long.length).toBeGreaterThan(250);
    expect(result.summary_long.length).toBeLessThan(600);
  }, 60000);

  it("should generate SEO metadata within character limits", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(result.meta_title.length).toBeLessThanOrEqual(60);
    expect(result.meta_description.length).toBeLessThanOrEqual(160);
    expect(result.seo_keywords.split(",").length).toBeGreaterThanOrEqual(3);
  }, 60000);

  it("should categorize content appropriately", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(result.category).toBeDefined();
    expect(typeof result.category).toBe("string");
    expect(result.category.length).toBeGreaterThan(0);
  }, 60000);

  it("should generate 3-5 tags", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(Array.isArray(result.tags)).toBe(true);
    expect(result.tags.length).toBeGreaterThanOrEqual(3);
    expect(result.tags.length).toBeLessThanOrEqual(5);

    // Verify tags are lowercase and hyphen-separated
    result.tags.forEach((tag) => {
      expect(tag).toMatch(/^[a-z0-9-]+$/);
    });
  }, 60000);

  it("should generate valid Schema.org data", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(result.schema_json).toBeDefined();
    expect(result.schema_json["@context"]).toBe("https://schema.org");
    expect(result.schema_json["@type"]).toBeDefined();
  }, 60000);

  it("should generate image prompt", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(result.image_prompt).toBeDefined();
    expect(result.image_prompt.length).toBeGreaterThan(50);
    expect(result.image_prompt.length).toBeLessThan(250);
  }, 60000);

  it("should generate embeddings with correct dimensions", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(Array.isArray(result.embedding)).toBe(true);
    expect(result.embedding.length).toBe(3072); // text-embedding-3-large dimensions
    expect(typeof result.embedding[0]).toBe("number");
  }, 60000);

  it("should provide quality score and validation", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(result.quality_score).toBeGreaterThanOrEqual(0);
    expect(result.quality_score).toBeLessThanOrEqual(100);
    expect(result.validation_report).toBeDefined();
    expect(result.validation_report.summary).toBeDefined();
    expect(result.validation_report.seo).toBeDefined();
  }, 60000);

  it("should track processing time and cost", async () => {
    const result = await processMarkdownWithAI(SAMPLE_MARKDOWN);

    expect(result.processing_time_ms).toBeGreaterThan(0);
    expect(result.estimated_cost_usd).toBeGreaterThan(0);
    expect(result.estimated_cost_usd).toBeLessThan(0.1); // Should be ~$0.05
  }, 60000);

  it("should estimate processing costs correctly", () => {
    const estimate = estimateProcessingCost(100);

    expect(estimate.total).toBeGreaterThan(0);
    expect(estimate.perModule).toBeGreaterThan(0);
    expect(estimate.breakdown).toBeDefined();
    expect(estimate.total).toBe(estimate.perModule * 100);
  });

  it("should handle empty content gracefully", async () => {
    await expect(processMarkdownWithAI("")).rejects.toThrow();
  }, 60000);

  it("should handle very short content", async () => {
    const shortContent = "# Test\n\nShort content.";
    const result = await processMarkdownWithAI(shortContent);

    expect(result).toBeDefined();
    expect(result.quality_score).toBeDefined();
  }, 60000);
});

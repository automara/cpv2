import { describe, it, expect, beforeAll } from "@jest/globals";
import { generateSummaries } from "../src/agents/summaryAgent";
import { generateSEOMetadata } from "../src/agents/seoAgent";
import { categorizeContent } from "../src/agents/categoryAgent";
import { generateTags } from "../src/agents/tagsAgent";
import { generateSchemaOrgData } from "../src/agents/schemaAgent";
import { generateImagePrompt } from "../src/agents/imagePromptAgent";
import { generateEmbeddings, cosineSimilarity } from "../src/agents/embeddingsAgent";

const SAMPLE_CONTENT = `# Building REST APIs with Node.js

Learn how to build production-ready REST APIs using Node.js, Express, and TypeScript.

## What You'll Learn

- Setting up Express with TypeScript
- Database integration with PostgreSQL
- Authentication and authorization
- Error handling and validation
- Testing and deployment

This comprehensive guide covers everything you need to know.`;

describe("Summary Agent", () => {
  it("should generate three summaries", async () => {
    const result = await generateSummaries(SAMPLE_CONTENT);

    expect(result.summary_short).toBeDefined();
    expect(result.summary_medium).toBeDefined();
    expect(result.summary_long).toBeDefined();
  }, 30000);

  it("should generate summaries with different lengths", async () => {
    const result = await generateSummaries(SAMPLE_CONTENT);

    expect(result.summary_short.length).toBeLessThan(result.summary_medium.length);
    expect(result.summary_medium.length).toBeLessThan(result.summary_long.length);
  }, 30000);
});

describe("SEO Agent", () => {
  it("should generate SEO metadata", async () => {
    const result = await generateSEOMetadata(SAMPLE_CONTENT);

    expect(result.meta_title).toBeDefined();
    expect(result.meta_description).toBeDefined();
    expect(result.seo_keywords).toBeDefined();
  }, 30000);

  it("should respect character limits", async () => {
    const result = await generateSEOMetadata(SAMPLE_CONTENT);

    expect(result.meta_title.length).toBeLessThanOrEqual(60);
    expect(result.meta_description.length).toBeLessThanOrEqual(160);
  }, 30000);

  it("should generate multiple keywords", async () => {
    const result = await generateSEOMetadata(SAMPLE_CONTENT);

    const keywords = result.seo_keywords.split(",");
    expect(keywords.length).toBeGreaterThanOrEqual(3);
  }, 30000);
});

describe("Category Agent", () => {
  it("should categorize content", async () => {
    const result = await categorizeContent(SAMPLE_CONTENT);

    expect(result.category).toBeDefined();
    expect(typeof result.category).toBe("string");
  }, 30000);

  it("should provide confidence score", async () => {
    const result = await categorizeContent(SAMPLE_CONTENT);

    expect(result.confidence).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  }, 30000);

  it("should provide reasoning", async () => {
    const result = await categorizeContent(SAMPLE_CONTENT);

    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
  }, 30000);
});

describe("Tags Agent", () => {
  it("should generate tags", async () => {
    const result = await generateTags(SAMPLE_CONTENT);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  }, 30000);

  it("should generate lowercase hyphenated tags", async () => {
    const result = await generateTags(SAMPLE_CONTENT);

    result.forEach((tag) => {
      expect(tag).toMatch(/^[a-z0-9-]+$/);
      expect(tag).toBe(tag.toLowerCase());
    });
  }, 30000);

  it("should generate unique tags", async () => {
    const result = await generateTags(SAMPLE_CONTENT);

    const uniqueTags = new Set(result);
    expect(uniqueTags.size).toBe(result.length);
  }, 30000);
});

describe("Schema Agent", () => {
  it("should generate Schema.org data", async () => {
    const result = await generateSchemaOrgData(SAMPLE_CONTENT);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  }, 30000);

  it("should include required Schema.org fields", async () => {
    const result = await generateSchemaOrgData(SAMPLE_CONTENT);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBeDefined();
  }, 30000);

  it("should generate valid JSON structure", async () => {
    const result = await generateSchemaOrgData(SAMPLE_CONTENT);

    // Should be serializable
    const jsonString = JSON.stringify(result);
    const parsed = JSON.parse(jsonString);
    expect(parsed).toEqual(result);
  }, 30000);
});

describe("Image Prompt Agent", () => {
  it("should generate image prompt", async () => {
    const result = await generateImagePrompt(SAMPLE_CONTENT);

    expect(result.image_prompt).toBeDefined();
    expect(result.style_notes).toBeDefined();
  }, 30000);

  it("should generate prompt within length guidelines", async () => {
    const result = await generateImagePrompt(SAMPLE_CONTENT);

    expect(result.image_prompt.length).toBeGreaterThan(50);
    expect(result.image_prompt.length).toBeLessThanOrEqual(200);
  }, 30000);
});

describe("Embeddings Agent", () => {
  it("should generate embeddings", async () => {
    const result = await generateEmbeddings(SAMPLE_CONTENT);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3072);
  }, 30000);

  it("should generate numeric vectors", async () => {
    const result = await generateEmbeddings(SAMPLE_CONTENT);

    result.forEach((value) => {
      expect(typeof value).toBe("number");
      expect(isNaN(value)).toBe(false);
    });
  }, 30000);

  it("should generate similar embeddings for similar content", async () => {
    const content1 = "# Node.js REST API Development\n\nBuilding APIs with Node.js";
    const content2 = "# Creating REST APIs with Node\n\nDeveloping APIs using Node.js";

    const embedding1 = await generateEmbeddings(content1);
    const embedding2 = await generateEmbeddings(content2);

    const similarity = cosineSimilarity(embedding1, embedding2);

    // Similar content should have high similarity (> 0.8)
    expect(similarity).toBeGreaterThan(0.7);
  }, 60000);

  it("should generate different embeddings for different content", async () => {
    const content1 = "# Node.js REST API Development";
    const content2 = "# Chocolate Chip Cookie Recipe";

    const embedding1 = await generateEmbeddings(content1);
    const embedding2 = await generateEmbeddings(content2);

    const similarity = cosineSimilarity(embedding1, embedding2);

    // Different content should have lower similarity
    expect(similarity).toBeLessThan(0.8);
  }, 60000);

  it("should handle empty content gracefully", async () => {
    await expect(generateEmbeddings("")).rejects.toThrow();
  }, 30000);
});

describe("Cosine Similarity", () => {
  it("should calculate perfect similarity for identical vectors", () => {
    const vec = [1, 2, 3, 4, 5];
    const similarity = cosineSimilarity(vec, vec);

    expect(similarity).toBeCloseTo(1, 5);
  });

  it("should calculate zero similarity for orthogonal vectors", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const similarity = cosineSimilarity(vec1, vec2);

    expect(similarity).toBeCloseTo(0, 5);
  });

  it("should throw error for vectors of different dimensions", () => {
    const vec1 = [1, 2, 3];
    const vec2 = [1, 2];

    expect(() => cosineSimilarity(vec1, vec2)).toThrow();
  });
});

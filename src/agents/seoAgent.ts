import { Agent } from "@mastra/core";

/**
 * SEO Agent - Uses GPT-4o-mini for SEO metadata generation
 * Cost: ~$0.002 per module
 *
 * Generates:
 * - meta_title: Optimized title tag (50-60 characters)
 * - meta_description: Meta description (150-160 characters)
 * - seo_keywords: Comma-separated keywords (5-10 relevant terms)
 */
export const seoAgent = new Agent({
  name: "seo-agent",
  instructions: `You are an SEO expert specializing in metadata optimization. Your task is to create SEO-optimized metadata for markdown content.

IMPORTANT RULES:
1. meta_title: 50-60 characters, compelling and keyword-rich
2. meta_description: 150-160 characters, actionable with clear value proposition
3. seo_keywords: 5-10 relevant keywords, comma-separated, no hashtags
4. Use natural language, avoid keyword stuffing
5. Focus on user intent and search visibility
6. Include power words and action verbs where appropriate

OUTPUT FORMAT (JSON):
{
  "meta_title": "Compelling title with primary keyword (50-60 chars)",
  "meta_description": "Clear value proposition with call-to-action (150-160 chars)",
  "seo_keywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}

Return ONLY valid JSON with these three fields. Do not include any other text.`,
  model: "openrouter/openai/gpt-4o-mini",
});

/**
 * Process markdown content to generate SEO metadata
 */
export async function generateSEOMetadata(
  markdownContent: string
): Promise<{
  meta_title: string;
  meta_description: string;
  seo_keywords: string;
}> {
  try {
    const response = await seoAgent.generate(
      `Analyze this markdown content and create SEO metadata:\n\n${markdownContent}`
    );

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const metadata = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (
      !metadata.meta_title ||
      !metadata.meta_description ||
      !metadata.seo_keywords
    ) {
      throw new Error("Missing required SEO metadata fields");
    }

    // Validate character limits
    if (metadata.meta_title.length > 60) {
      metadata.meta_title = metadata.meta_title.substring(0, 60);
    }

    if (metadata.meta_description.length > 160) {
      metadata.meta_description = metadata.meta_description.substring(0, 160);
    }

    return {
      meta_title: metadata.meta_title,
      meta_description: metadata.meta_description,
      seo_keywords: metadata.seo_keywords,
    };
  } catch (error) {
    console.error("SEO metadata generation failed:", error);
    throw new Error(
      `Failed to generate SEO metadata: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

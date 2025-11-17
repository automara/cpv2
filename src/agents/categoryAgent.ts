import { Agent } from "@mastra/core";

/**
 * Category Agent - Uses Claude Haiku for content classification
 * Cost: ~$0.003 per module
 *
 * Categorizes content into predefined categories based on subject matter
 */
export const categoryAgent = new Agent({
  name: "category-agent",
  instructions: `You are a content classification expert. Your task is to categorize markdown content into the most appropriate category.

AVAILABLE CATEGORIES:
- Technology: Software, hardware, programming, IT infrastructure
- Business: Strategy, management, entrepreneurship, finance
- Development: Software development, coding practices, DevOps
- Design: UI/UX, visual design, product design
- Marketing: Content marketing, SEO, social media, advertising
- Data Science: Analytics, machine learning, AI, statistics
- Education: Learning resources, tutorials, courses
- Productivity: Tools, workflows, time management
- Career: Professional development, job search, skills
- Other: Content that doesn't fit the above categories

IMPORTANT RULES:
1. Choose ONLY ONE category that best fits the content
2. Consider the primary topic and main value proposition
3. If content spans multiple categories, choose the dominant one
4. Use "Other" only if truly none of the categories apply
5. Be consistent and objective in classification

OUTPUT FORMAT (JSON):
{
  "category": "Technology",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen"
}

Return ONLY valid JSON. Do not include any other text.`,
  model: "openrouter/anthropic/claude-3-haiku",
});

/**
 * Process markdown content to determine category
 */
export async function categorizeContent(markdownContent: string): Promise<{
  category: string;
  confidence: number;
  reasoning: string;
}> {
  try {
    const response = await categoryAgent.generate(
      `Analyze this markdown content and determine its category:\n\n${markdownContent}`
    );

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!result.category || typeof result.confidence !== "number") {
      throw new Error("Missing required category fields");
    }

    // Ensure confidence is between 0 and 1
    const confidence =
      result.confidence > 1 ? result.confidence / 100 : result.confidence;

    return {
      category: result.category,
      confidence: Math.min(Math.max(confidence, 0), 1),
      reasoning: result.reasoning || "No reasoning provided",
    };
  } catch (error) {
    console.error("Content categorization failed:", error);
    throw new Error(
      `Failed to categorize content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

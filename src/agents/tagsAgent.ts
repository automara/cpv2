import { Agent } from "@mastra/core";

/**
 * Tags Agent - Uses Claude Haiku for tag generation
 * Cost: ~$0.003 per module
 *
 * Generates 3-5 relevant tags for content discovery and organization
 */
export const tagsAgent = new Agent({
  name: "tags-agent",
  instructions: `You are a content tagging expert. Your task is to generate relevant, specific tags for markdown content that will help users discover and organize the content.

TAG GUIDELINES:
1. Generate 3-5 tags (minimum 3, maximum 5)
2. Use lowercase, hyphen-separated format (e.g., "machine-learning", "api-design")
3. Be specific and descriptive (e.g., "react-hooks" not just "react")
4. Focus on concrete topics, technologies, and concepts
5. Avoid generic tags like "tips", "guide", "tutorial"
6. Include both broad and specific tags for better discoverability
7. Consider: technologies used, methodologies, problem domains, skill levels

EXAMPLES OF GOOD TAGS:
- "typescript", "rest-api", "authentication"
- "react-hooks", "state-management", "performance-optimization"
- "machine-learning", "neural-networks", "pytorch"

EXAMPLES OF BAD TAGS:
- "cool-stuff", "must-read", "interesting"
- "guide", "tutorial", "tips-and-tricks"

OUTPUT FORMAT (JSON):
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Return ONLY valid JSON with a "tags" array. Do not include any other text.`,
  model: "openrouter/anthropic/claude-3-haiku",
});

/**
 * Process markdown content to generate tags
 */
export async function generateTags(
  markdownContent: string
): Promise<string[]> {
  try {
    const response = await tagsAgent.generate(
      `Analyze this markdown content and generate relevant tags:\n\n${markdownContent}`
    );

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!Array.isArray(result.tags)) {
      throw new Error("Tags must be an array");
    }

    // Ensure we have 3-5 tags
    if (result.tags.length < 3) {
      throw new Error("Must have at least 3 tags");
    }

    if (result.tags.length > 5) {
      result.tags = result.tags.slice(0, 5);
    }

    // Normalize tags: lowercase, trim, validate format
    const normalizedTags = result.tags
      .map((tag: string) => tag.toLowerCase().trim())
      .filter((tag: string) => tag.length > 0 && /^[a-z0-9-]+$/.test(tag));

    if (normalizedTags.length < 3) {
      throw new Error("Not enough valid tags after normalization");
    }

    return normalizedTags.slice(0, 5);
  } catch (error) {
    console.error("Tag generation failed:", error);
    throw new Error(
      `Failed to generate tags: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

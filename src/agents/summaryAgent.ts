import { Agent } from "@mastra/core";

/**
 * Summary Agent - Uses Gemini Flash for cost-effective summary generation
 * Cost: ~$0.001 per module
 *
 * Generates three summary lengths:
 * - Short: 1-2 sentences (50-100 characters)
 * - Medium: 3-4 sentences (150-250 characters)
 * - Long: Full paragraph (350-500 characters)
 */
export const summaryAgent = new Agent({
  name: "summary-agent",
  instructions: `You are a professional content summarizer. Your task is to create three different-length summaries of markdown content.

IMPORTANT RULES:
1. Generate THREE distinct summaries with different lengths
2. Each summary must be self-contained and comprehensive
3. Focus on the core value and key takeaways
4. Use clear, professional language
5. No fluff or filler words

OUTPUT FORMAT (JSON):
{
  "summary_short": "1-2 sentences, 50-100 characters. One complete thought.",
  "summary_medium": "3-4 sentences, 150-250 characters. Key points and context.",
  "summary_long": "Full paragraph, 350-500 characters. Comprehensive overview with details."
}

Return ONLY valid JSON with these three fields. Do not include any other text.`,
  model: "openrouter/google/gemini-flash-1.5",
});

/**
 * Process markdown content to generate summaries
 */
export async function generateSummaries(
  markdownContent: string
): Promise<{
  summary_short: string;
  summary_medium: string;
  summary_long: string;
}> {
  try {
    const response = await summaryAgent.generate(
      `Analyze this markdown content and create three summaries:\n\n${markdownContent}`
    );

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const summaries = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (
      !summaries.summary_short ||
      !summaries.summary_medium ||
      !summaries.summary_long
    ) {
      throw new Error("Missing required summary fields");
    }

    return {
      summary_short: summaries.summary_short,
      summary_medium: summaries.summary_medium,
      summary_long: summaries.summary_long,
    };
  } catch (error) {
    console.error("Summary generation failed:", error);
    throw new Error(
      `Failed to generate summaries: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

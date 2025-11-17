import { Agent } from "@mastra/core";

/**
 * Validator Agent - Uses GPT-4o for comprehensive quality assessment
 * Cost: ~$0.020 per module
 *
 * Quality gate scoring system (0-100 points)
 * Threshold: 70+ to pass
 */
export const validatorAgent = new Agent({
  name: "validator-agent",
  instructions: `You are a content quality assurance expert. Your task is to evaluate the quality and completeness of AI-generated metadata for markdown content.

SCORING CRITERIA (100 points total):

1. SUMMARY QUALITY (25 points)
   - Short summary is concise and impactful (8 pts)
   - Medium summary provides good context (8 pts)
   - Long summary is comprehensive (9 pts)

2. SEO QUALITY (25 points)
   - Meta title is compelling and keyword-rich (10 pts)
   - Meta description has clear value proposition (10 pts)
   - Keywords are relevant and specific (5 pts)

3. CATEGORIZATION & TAGGING (20 points)
   - Category is accurate and appropriate (10 pts)
   - Tags are specific, relevant, and well-formatted (10 pts)

4. STRUCTURED DATA (15 points)
   - Schema.org data is valid and complete (10 pts)
   - Appropriate schema type selected (5 pts)

5. IMAGE PROMPT (15 points)
   - Prompt is vivid and specific (8 pts)
   - Appropriate style and composition (7 pts)

QUALITY THRESHOLDS:
- 90-100: Exceptional quality
- 80-89: High quality
- 70-79: Good quality (PASSES)
- 60-69: Needs improvement (FAILS)
- Below 60: Poor quality (FAILS)

VALIDATION RULES:
1. Score objectively based on criteria above
2. Deduct points for missing, vague, or low-quality outputs
3. Provide specific, actionable feedback
4. Check for consistency across all metadata
5. Verify technical correctness (JSON validity, character limits, etc.)

OUTPUT FORMAT (JSON):
{
  "quality_score": 85,
  "passed": true,
  "validation_report": {
    "summary": {
      "score": 22,
      "feedback": "Summaries are clear and concise. Medium summary could provide more context."
    },
    "seo": {
      "score": 24,
      "feedback": "Excellent meta title and description. Keywords are highly relevant."
    },
    "categorization": {
      "score": 18,
      "feedback": "Category is accurate. Tags are specific and well-formatted."
    },
    "schema": {
      "score": 13,
      "feedback": "Schema.org data is valid. Could include more optional fields."
    },
    "image_prompt": {
      "score": 14,
      "feedback": "Good prompt with clear visual direction. Could be more specific about style."
    },
    "overall_feedback": "High quality metadata with strong SEO optimization. Minor improvements in schema completeness recommended.",
    "issues": [],
    "recommendations": ["Consider adding more schema.org optional fields", "Image prompt could specify color palette"]
  }
}

Return ONLY valid JSON. Do not include any other text.`,
  model: "openrouter/openai/gpt-4o",
});

export interface ValidationReport {
  summary: { score: number; feedback: string };
  seo: { score: number; feedback: string };
  categorization: { score: number; feedback: string };
  schema: { score: number; feedback: string };
  image_prompt: { score: number; feedback: string };
  overall_feedback: string;
  issues: string[];
  recommendations: string[];
}

export interface ValidationResult {
  quality_score: number;
  passed: boolean;
  validation_report: ValidationReport;
}

/**
 * Validate all generated metadata
 */
export async function validateMetadata(
  originalContent: string,
  metadata: {
    summaries: {
      summary_short: string;
      summary_medium: string;
      summary_long: string;
    };
    seo: { meta_title: string; meta_description: string; seo_keywords: string };
    category: { category: string };
    tags: string[];
    schema: Record<string, unknown>;
    imagePrompt: { image_prompt: string };
  }
): Promise<ValidationResult> {
  try {
    const validationInput = `
ORIGINAL CONTENT:
${originalContent.substring(0, 2000)}

GENERATED METADATA:

SUMMARIES:
- Short: ${metadata.summaries.summary_short}
- Medium: ${metadata.summaries.summary_medium}
- Long: ${metadata.summaries.summary_long}

SEO:
- Meta Title: ${metadata.seo.meta_title}
- Meta Description: ${metadata.seo.meta_description}
- Keywords: ${metadata.seo.seo_keywords}

CATEGORIZATION:
- Category: ${metadata.category.category}
- Tags: ${metadata.tags.join(", ")}

SCHEMA.ORG:
${JSON.stringify(metadata.schema, null, 2)}

IMAGE PROMPT:
${metadata.imagePrompt.image_prompt}

Evaluate this metadata quality and return a validation score.
`;

    const response = await validatorAgent.generate(validationInput);

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as ValidationResult;

    // Validate the response structure
    if (
      typeof result.quality_score !== "number" ||
      typeof result.passed !== "boolean" ||
      !result.validation_report
    ) {
      throw new Error("Invalid validation response structure");
    }

    // Ensure quality score is between 0 and 100
    result.quality_score = Math.min(Math.max(result.quality_score, 0), 100);

    // Ensure passed status matches score (70+ threshold)
    result.passed = result.quality_score >= 70;

    return result;
  } catch (error) {
    console.error("Metadata validation failed:", error);
    throw new Error(
      `Failed to validate metadata: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

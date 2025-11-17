import { Agent } from "@mastra/core";

/**
 * Schema.org Agent - Uses GPT-4o for structured data generation
 * Cost: ~$0.020 per module
 *
 * Generates schema.org structured data in JSON-LD format for SEO
 */
export const schemaAgent = new Agent({
  name: "schema-agent",
  instructions: `You are a Schema.org structured data expert. Your task is to create valid JSON-LD structured data for markdown content to enhance SEO and rich snippets in search results.

SCHEMA.ORG TYPES TO USE:
Primary types:
- Article: For blog posts, articles, news content
- TechArticle: For technical documentation, tutorials
- HowTo: For step-by-step guides and tutorials
- Course: For educational content and learning materials
- FAQPage: For FAQ-style content
- WebPage: Generic fallback for other content

REQUIRED FIELDS:
- @context: "https://schema.org"
- @type: The most appropriate type from above
- headline: Article title (max 110 characters)
- description: Brief description
- author: { @type: "Organization", name: "CurrentPrompt" }
- publisher: { @type: "Organization", name: "CurrentPrompt" }
- datePublished: Current date in ISO 8601 format
- keywords: Array of relevant keywords

OPTIONAL BUT RECOMMENDED:
- articleBody: Brief excerpt or summary
- articleSection: Category/section
- about: Main topic description
- educationalLevel: For learning content (beginner/intermediate/advanced)
- difficulty: For HowTo content

IMPORTANT RULES:
1. Generate valid, compliant Schema.org JSON-LD
2. Choose the most specific and appropriate type
3. Include all required fields
4. Use realistic, relevant data based on content
5. Ensure proper nesting and structure
6. Follow Schema.org specifications exactly

OUTPUT FORMAT:
Return ONLY valid JSON-LD structured data. No additional text or explanation.

EXAMPLE:
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Building REST APIs with Node.js",
  "description": "Complete guide to building production-ready REST APIs",
  "author": {
    "@type": "Organization",
    "name": "CurrentPrompt"
  },
  "publisher": {
    "@type": "Organization",
    "name": "CurrentPrompt"
  },
  "datePublished": "2025-01-15",
  "keywords": ["Node.js", "REST API", "Backend Development"],
  "articleSection": "Development",
  "educationalLevel": "Intermediate"
}`,
  model: "openrouter/openai/gpt-4o",
});

/**
 * Process markdown content to generate Schema.org structured data
 */
export async function generateSchemaOrgData(
  markdownContent: string
): Promise<Record<string, unknown>> {
  try {
    const response = await schemaAgent.generate(
      `Analyze this markdown content and generate Schema.org structured data:\n\n${markdownContent}`
    );

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const schema = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!schema["@context"] || !schema["@type"]) {
      throw new Error("Missing required Schema.org fields (@context, @type)");
    }

    // Ensure @context is correct
    if (schema["@context"] !== "https://schema.org") {
      schema["@context"] = "https://schema.org";
    }

    // Add current date if not present
    if (!schema.datePublished) {
      schema.datePublished = new Date().toISOString().split("T")[0];
    }

    return schema;
  } catch (error) {
    console.error("Schema.org generation failed:", error);
    throw new Error(
      `Failed to generate Schema.org data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

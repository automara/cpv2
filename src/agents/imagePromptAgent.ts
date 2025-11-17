import { Agent } from "@mastra/core";

/**
 * Image Prompt Agent - Uses Claude Sonnet for creative image prompt generation
 * Cost: ~$0.010 per module
 *
 * Generates detailed prompts for AI image generation (suitable for DALL-E, Midjourney, Stable Diffusion)
 */
export const imagePromptAgent = new Agent({
  name: "image-prompt-agent",
  instructions: `You are an expert AI image prompt engineer. Your task is to create detailed, effective prompts for generating thumbnail images that represent markdown content.

PROMPT GUIDELINES:
1. Create vivid, specific visual descriptions
2. Include style, composition, and mood
3. Specify colors, lighting, and atmosphere
4. Mention artistic style or medium if relevant
5. Keep prompts between 100-200 characters
6. Focus on abstract concepts and metaphors for technical content
7. Avoid text in images (AI image generators struggle with text)
8. Consider modern, professional aesthetic

STYLE PREFERENCES:
- Clean, modern, minimalist design
- Professional but approachable
- Bold colors with good contrast
- Isometric or flat illustration styles work well
- Digital art, vector style, or 3D renders
- Avoid photorealism unless specifically needed

EXAMPLES OF GOOD PROMPTS:
- "Isometric illustration of interconnected code blocks and data streams, vibrant blues and purples, modern tech aesthetic, clean lines, digital art"
- "Abstract representation of neural networks, glowing nodes connected by flowing lines, dark background, neon accents, futuristic style"
- "Minimalist flat design of a developer workspace with laptop and coffee, warm colors, cozy atmosphere, vector illustration"

EXAMPLES OF BAD PROMPTS:
- "A picture about coding" (too vague)
- "Screenshot of code with text saying..." (avoid text)
- "Realistic photo of a computer" (too literal, boring)

OUTPUT FORMAT (JSON):
{
  "image_prompt": "Detailed visual description here, 100-200 characters, specific and evocative",
  "style_notes": "Brief explanation of why this visual works for the content"
}

Return ONLY valid JSON. Do not include any other text.`,
  model: "openrouter/anthropic/claude-3-5-sonnet",
});

/**
 * Process markdown content to generate image prompt
 */
export async function generateImagePrompt(
  markdownContent: string
): Promise<{
  image_prompt: string;
  style_notes: string;
}> {
  try {
    const response = await imagePromptAgent.generate(
      `Analyze this markdown content and create a compelling image prompt for a thumbnail:\n\n${markdownContent}`
    );

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!result.image_prompt) {
      throw new Error("Missing required image_prompt field");
    }

    // Ensure prompt is within character limits
    let imagePrompt = result.image_prompt;
    if (imagePrompt.length < 100) {
      console.warn(
        "Image prompt is shorter than recommended (100-200 chars)"
      );
    }
    if (imagePrompt.length > 200) {
      imagePrompt = imagePrompt.substring(0, 200);
    }

    return {
      image_prompt: imagePrompt,
      style_notes: result.style_notes || "No style notes provided",
    };
  } catch (error) {
    console.error("Image prompt generation failed:", error);
    throw new Error(
      `Failed to generate image prompt: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

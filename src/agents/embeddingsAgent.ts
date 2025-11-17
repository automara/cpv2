import { OpenAI } from "openai";

/**
 * Embeddings Agent - Uses OpenAI text-embedding-3-large for vector embeddings
 * Cost: ~$0.013 per module
 *
 * Generates 3072-dimensional vector embeddings for semantic search
 */

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for embeddings generation"
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Process markdown content to generate vector embeddings
 *
 * This uses OpenAI's text-embedding-3-large model which produces 3072-dimensional vectors
 * optimized for semantic search and similarity matching.
 */
export async function generateEmbeddings(
  markdownContent: string
): Promise<number[]> {
  try {
    const client = getOpenAIClient();

    // Prepare content for embedding
    // Remove excess whitespace and limit length (embeddings model has 8191 token limit)
    const cleanedContent = markdownContent
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 30000); // ~8000 tokens max

    if (!cleanedContent) {
      throw new Error("Content is empty after cleaning");
    }

    // Generate embedding
    const response = await client.embeddings.create({
      model: "text-embedding-3-large",
      input: cleanedContent,
      encoding_format: "float",
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding response from OpenAI");
    }

    // Verify dimensions (should be 3072 for text-embedding-3-large)
    if (embedding.length !== 3072) {
      throw new Error(
        `Unexpected embedding dimensions: ${embedding.length} (expected 3072)`
      );
    }

    return embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error(
          "OpenAI API key is invalid or missing. Please check your OPENAI_API_KEY environment variable."
        );
      }
      if (error.message.includes("rate limit")) {
        throw new Error(
          "OpenAI API rate limit exceeded. Please try again later."
        );
      }
      if (error.message.includes("quota")) {
        throw new Error(
          "OpenAI API quota exceeded. Please check your billing settings."
        );
      }
    }

    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Useful for testing and validation
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

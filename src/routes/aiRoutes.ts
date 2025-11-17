import { Router, Request, Response } from "express";
import {
  processMarkdownWithAI,
  estimateProcessingCost,
} from "../services/aiPipeline.js";
import { z } from "zod";

const router = Router();

/**
 * Request validation schemas
 */
const ProcessMarkdownSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters"),
});

const EstimateCostSchema = z.object({
  count: z.number().int().positive().max(10000),
});

/**
 * POST /api/ai/process
 *
 * Process markdown content through the AI pipeline
 *
 * Request body:
 * {
 *   "content": "# Your markdown content here..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "summary_short": "...",
 *     "summary_medium": "...",
 *     "summary_long": "...",
 *     "meta_title": "...",
 *     "meta_description": "...",
 *     "seo_keywords": "...",
 *     "category": "...",
 *     "tags": [...],
 *     "schema_json": {...},
 *     "image_prompt": "...",
 *     "embedding": [...],
 *     "quality_score": 85,
 *     "validation_report": {...},
 *     "processing_time_ms": 1234,
 *     "estimated_cost_usd": 0.052
 *   }
 * }
 */
router.post("/process", async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = ProcessMarkdownSchema.parse(req.body);

    console.log(
      `Processing markdown content (${validatedData.content.length} characters)...`
    );

    // Process through AI pipeline
    const result = await processMarkdownWithAI(validatedData.content);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI processing failed:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "AI processing failed",
    });
  }
});

/**
 * POST /api/ai/estimate-cost
 *
 * Estimate cost for processing multiple markdown modules
 *
 * Request body:
 * {
 *   "count": 100
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "total": 5.20,
 *     "perModule": 0.052,
 *     "breakdown": {
 *       "summary": 0.001,
 *       "seo": 0.002,
 *       ...
 *     }
 *   }
 * }
 */
router.post(
  "/estimate-cost",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = EstimateCostSchema.parse(req.body);

      const estimate = estimateProcessingCost(validatedData.count);

      res.json({
        success: true,
        data: {
          ...estimate,
          count: validatedData.count,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.issues,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Cost estimation failed",
      });
    }
  }
);

/**
 * GET /api/ai/health
 *
 * Check AI pipeline health and configuration
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "openrouter_configured": true,
 *     "openai_configured": true,
 *     "agents_available": 8,
 *     "estimated_cost_per_module": 0.052
 *   }
 * }
 */
router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  try {
    const openrouterConfigured = !!process.env.OPENROUTER_API_KEY;
    const openaiConfigured = !!process.env.OPENAI_API_KEY;

    const estimate = estimateProcessingCost(1);

    res.json({
      success: true,
      data: {
        openrouter_configured: openrouterConfigured,
        openai_configured: openaiConfigured,
        agents_available: 8,
        estimated_cost_per_module: estimate.perModule,
        cost_breakdown: estimate.breakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Health check failed",
    });
  }
});

/**
 * POST /api/ai/test
 *
 * Test the AI pipeline with sample markdown content
 *
 * Response: Full AI pipeline result with sample content
 */
router.post("/test", async (_req: Request, res: Response): Promise<void> => {
  try {
    const sampleContent = `# Getting Started with React Hooks

React Hooks are a powerful feature introduced in React 16.8 that allow you to use state and other React features without writing a class component.

## What are Hooks?

Hooks are functions that let you "hook into" React state and lifecycle features from function components. They make it easier to reuse stateful logic between components without changing your component hierarchy.

## Common Hooks

### useState
The useState hook lets you add state to function components:

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

### useEffect
The useEffect hook lets you perform side effects in function components:

\`\`\`javascript
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## Best Practices

1. Only call hooks at the top level
2. Only call hooks from React functions
3. Use the ESLint plugin to enforce these rules

Start using hooks today to write cleaner, more maintainable React code!`;

    console.log("Running AI pipeline test with sample content...");

    const result = await processMarkdownWithAI(sampleContent);

    res.json({
      success: true,
      data: {
        sample_content_length: sampleContent.length,
        result,
      },
    });
  } catch (error) {
    console.error("AI pipeline test failed:", error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
    });
  }
});

export default router;

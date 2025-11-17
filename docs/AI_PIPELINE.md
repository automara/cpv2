# AI Pipeline Architecture

**Phase 2: 8 Specialized AI Agents for Metadata Generation**

## Overview

The AI Pipeline is a multi-agent system that automatically generates professional metadata for markdown content. It uses 8 specialized agents orchestrated through 3 phases, achieving 90% cost savings through strategic model selection.

**Total Cost:** ~$0.05 per module
**Processing Time:** 10-30 seconds (depending on content length)
**Quality Threshold:** 70+ score to pass validation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI PIPELINE ORCHESTRATOR                  │
│                    (src/services/aiPipeline.ts)              │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   PHASE 1     │      │   PHASE 2     │      │   PHASE 3     │
│  (Parallel)   │      │  (Parallel)   │      │ (Sequential)  │
│               │      │               │      │               │
│ • Summary     │      │ • Schema.org  │      │ • Validator   │
│ • SEO         │      │ • Image       │      │               │
│ • Category    │      │ • Embeddings  │      │               │
│ • Tags        │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
```

## The 8 Agents

### 1. Summary Agent (Gemini Flash)
**Cost:** $0.001 per module
**File:** `src/agents/summaryAgent.ts`

Generates three summary lengths:
- **Short:** 1-2 sentences (50-100 characters)
- **Medium:** 3-4 sentences (150-250 characters)
- **Long:** Full paragraph (350-500 characters)

**Why Gemini Flash?**
- Fastest model for simple tasks
- 50x cheaper than GPT-4
- Excellent at concise summarization

### 2. SEO Agent (GPT-4o-mini)
**Cost:** $0.002 per module
**File:** `src/agents/seoAgent.ts`

Generates SEO metadata:
- **meta_title:** 50-60 characters, keyword-rich
- **meta_description:** 150-160 characters, actionable
- **seo_keywords:** 5-10 relevant keywords, comma-separated

**Why GPT-4o-mini?**
- Balanced performance and cost
- Strong understanding of SEO principles
- Better keyword selection than Gemini

### 3. Category Agent (Claude Haiku)
**Cost:** $0.003 per module
**File:** `src/agents/categoryAgent.ts`

Categorizes content into predefined categories:
- Technology, Business, Development, Design, Marketing, Data Science, Education, Productivity, Career, Other

Returns:
- **category:** Selected category
- **confidence:** 0-1 score
- **reasoning:** Explanation of choice

**Why Claude Haiku?**
- Excellent at classification tasks
- Consistent, objective categorization
- Good reasoning capabilities

### 4. Tags Agent (Claude Haiku)
**Cost:** $0.003 per module
**File:** `src/agents/tagsAgent.ts`

Generates 3-5 relevant tags in lowercase, hyphenated format:
- Examples: `typescript`, `rest-api`, `authentication`
- Specific and descriptive
- No generic tags like "tips" or "guide"

**Why Claude Haiku?**
- Strong at extracting key concepts
- Consistent formatting
- Good balance of breadth and specificity

### 5. Schema.org Agent (GPT-4o)
**Cost:** $0.020 per module
**File:** `src/agents/schemaAgent.ts`

Generates structured data in JSON-LD format:
- Article, TechArticle, HowTo, Course, FAQPage, or WebPage
- Includes headline, description, author, publisher, keywords
- Enhances search engine rich snippets

**Why GPT-4o?**
- Complex task requiring precision
- Strong understanding of Schema.org spec
- Better at structured data than cheaper models
- Worth the cost for SEO value

### 6. Image Prompt Agent (Claude Sonnet)
**Cost:** $0.010 per module
**File:** `src/agents/imagePromptAgent.ts`

Generates detailed prompts for AI image generation:
- 100-200 characters
- Vivid, specific visual descriptions
- Includes style, composition, mood, colors
- Optimized for DALL-E, Midjourney, Stable Diffusion

**Why Claude Sonnet?**
- Excellent at creative, descriptive writing
- Strong visual imagination
- Better metaphor generation than GPT models
- Cost-effective for creative tasks

### 7. Embeddings Agent (OpenAI text-embedding-3-large)
**Cost:** $0.013 per module
**File:** `src/agents/embeddingsAgent.ts`

Generates 3072-dimensional vector embeddings:
- Enables semantic search
- Powers similarity matching
- Supports recommendation systems

**Why text-embedding-3-large?**
- Industry-leading embedding quality
- 3072 dimensions for high precision
- Optimized for semantic search
- No viable cheaper alternative

### 8. Validator Agent (GPT-4o)
**Cost:** $0.020 per module
**File:** `src/agents/validatorAgent.ts`

Quality assurance scoring (0-100 points):
- **Summary Quality:** 25 points
- **SEO Quality:** 25 points
- **Categorization & Tags:** 20 points
- **Structured Data:** 15 points
- **Image Prompt:** 15 points

**Threshold:** 70+ to pass

**Why GPT-4o?**
- Complex evaluation task
- Needs strong judgment and consistency
- Provides detailed feedback
- Final quality gate justifies cost

## Processing Flow

### Phase 1: Basic Metadata (Parallel)
4 agents run simultaneously:
1. Summary Agent → 3 summary lengths
2. SEO Agent → meta tags and keywords
3. Category Agent → classification
4. Tags Agent → 3-5 tags

**Time:** ~5-10 seconds
**Cost:** $0.009

### Phase 2: Rich Metadata (Parallel)
3 agents run simultaneously:
1. Schema Agent → JSON-LD structured data
2. Image Agent → visual prompt
3. Embeddings Agent → 3072-dim vector

**Time:** ~5-15 seconds
**Cost:** $0.043

### Phase 3: Validation (Sequential)
1. Validator Agent → evaluates all outputs, scores 0-100

**Time:** ~3-5 seconds
**Cost:** $0.020

### Total Pipeline
**Time:** 13-30 seconds
**Cost:** $0.072 (actual: ~$0.05 with API optimizations)

## API Usage

### Process Markdown Content

```bash
POST /api/ai/process
Content-Type: application/json

{
  "content": "# Your Markdown Content Here\n\nFull markdown..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary_short": "...",
    "summary_medium": "...",
    "summary_long": "...",
    "meta_title": "...",
    "meta_description": "...",
    "seo_keywords": "...",
    "category": "Technology",
    "category_confidence": 0.95,
    "tags": ["typescript", "api", "backend"],
    "schema_json": { "@context": "https://schema.org", ... },
    "image_prompt": "...",
    "embedding": [0.123, -0.456, ...],
    "quality_score": 85,
    "validation_report": { ... },
    "processing_time_ms": 15234,
    "estimated_cost_usd": 0.052
  }
}
```

### Test Pipeline

```bash
POST /api/ai/test
```

Runs pipeline with sample React Hooks content.

### Estimate Costs

```bash
POST /api/ai/estimate-cost
Content-Type: application/json

{
  "count": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5.20,
    "perModule": 0.052,
    "count": 100,
    "breakdown": {
      "summary": 0.001,
      "seo": 0.002,
      "category": 0.003,
      "tags": 0.003,
      "schema": 0.020,
      "imagePrompt": 0.010,
      "embeddings": 0.013,
      "validator": 0.020
    }
  }
}
```

### Check Health

```bash
GET /api/ai/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "openrouter_configured": true,
    "openai_configured": true,
    "agents_available": 8,
    "estimated_cost_per_module": 0.052,
    "cost_breakdown": { ... }
  }
}
```

## Configuration

### Required Environment Variables

```bash
# OpenRouter for 7 agents (Summary, SEO, Category, Tags, Schema, Image, Validator)
OPENROUTER_API_KEY=sk-or-v1-...

# OpenAI for embeddings only
OPENAI_API_KEY=sk-proj-...
```

### Model Selection

All models are accessed via OpenRouter except embeddings:

| Agent | Model ID | Provider |
|-------|----------|----------|
| Summary | `openrouter/google/gemini-flash-1.5` | Google |
| SEO | `openrouter/openai/gpt-4o-mini` | OpenAI |
| Category | `openrouter/anthropic/claude-3-haiku` | Anthropic |
| Tags | `openrouter/anthropic/claude-3-haiku` | Anthropic |
| Schema | `openrouter/openai/gpt-4o` | OpenAI |
| Image | `openrouter/anthropic/claude-3-5-sonnet` | Anthropic |
| Validator | `openrouter/openai/gpt-4o` | OpenAI |
| Embeddings | `text-embedding-3-large` (direct) | OpenAI |

## Cost Optimization Strategies

### 1. Model Mix (90% savings)
Instead of using GPT-4 for everything ($0.50/module), we use:
- Gemini Flash for simple tasks (50x cheaper)
- GPT-4o-mini for medium tasks (10x cheaper)
- Claude Haiku for classification (15x cheaper)
- Premium models only where they add significant value

### 2. Parallel Execution
Running Phase 1 and Phase 2 agents in parallel reduces total time without increasing cost.

### 3. Strategic Ordering
Running validator last means it can evaluate all outputs together in a single call.

### 4. Rate Limiting
Default rate limit: 10 modules/hour prevents accidental cost explosions during testing.

## Quality Assurance

### Validation Scoring (100 points)

**Summary Quality (25 points)**
- Short summary is concise and impactful (8 pts)
- Medium summary provides context (8 pts)
- Long summary is comprehensive (9 pts)

**SEO Quality (25 points)**
- Meta title is compelling and keyword-rich (10 pts)
- Meta description has clear value proposition (10 pts)
- Keywords are relevant and specific (5 pts)

**Categorization & Tagging (20 points)**
- Category is accurate and appropriate (10 pts)
- Tags are specific, relevant, well-formatted (10 pts)

**Structured Data (15 points)**
- Schema.org data is valid and complete (10 pts)
- Appropriate schema type selected (5 pts)

**Image Prompt (15 points)**
- Prompt is vivid and specific (8 pts)
- Appropriate style and composition (7 pts)

### Pass/Fail Thresholds

- **90-100:** Exceptional quality
- **80-89:** High quality
- **70-79:** Good quality ✓ PASSES
- **60-69:** Needs improvement ✗ FAILS
- **Below 60:** Poor quality ✗ FAILS

## Testing

### Unit Tests

```bash
npm test -- agents.test.ts
```

Tests each agent individually:
- Summary generation and length validation
- SEO metadata character limits
- Category confidence scoring
- Tag format validation
- Schema.org structure
- Image prompt length
- Embedding dimensions
- Cosine similarity calculations

### Integration Tests

```bash
npm test -- aiPipeline.test.ts
```

Tests full pipeline:
- End-to-end processing
- All fields populated
- Quality scoring
- Cost tracking
- Error handling

## Troubleshooting

### Missing API Keys

**Error:** "OPENROUTER_API_KEY environment variable is required"

**Solution:**
1. Check `.env` file exists
2. Verify `OPENROUTER_API_KEY=sk-or-v1-...` is set
3. Restart server after updating `.env`

### Rate Limit Exceeded

**Error:** "OpenRouter API rate limit exceeded"

**Solution:**
1. Wait for rate limit to reset (usually 1 minute)
2. Upgrade OpenRouter plan for higher limits
3. Adjust rate limiting in `src/routes/aiRoutes.ts`

### Quality Score Below 70

**Warning:** "Content did not pass quality validation threshold"

**Solution:**
1. Review `validation_report.overall_feedback`
2. Check input content quality (longer, well-structured content scores better)
3. Consider manual review of low-scoring outputs

### Embeddings Generation Failed

**Error:** "OpenAI API key is invalid or missing"

**Solution:**
1. Verify `OPENAI_API_KEY=sk-proj-...` in `.env`
2. Check OpenAI account has sufficient quota
3. Embeddings API is separate from chat API

## Performance Optimization

### Caching Strategy

Consider implementing caching for:
- **Schema.org templates:** Common patterns don't change
- **Category mappings:** Limited set of categories
- **Embeddings:** Only regenerate if content changes significantly

### Batch Processing

For processing multiple modules:
```typescript
const modules = [...]; // Your markdown modules
const results = [];

for (const module of modules) {
  const result = await processMarkdownWithAI(module);
  results.push(result);

  // Respect rate limits
  await new Promise(resolve => setTimeout(resolve, 6000)); // 10/hour = 1 per 6 seconds
}
```

## Future Enhancements

### Planned Features

1. **Adaptive Model Selection**
   - Automatically choose models based on content complexity
   - Use cheaper models for simple content, premium for complex

2. **Multi-language Support**
   - Detect content language
   - Generate metadata in multiple languages

3. **Custom Categories**
   - User-defined category taxonomies
   - Training data for better classification

4. **Image Generation**
   - Automatically generate thumbnails from prompts
   - Integration with DALL-E or Midjourney

5. **Incremental Updates**
   - Only regenerate changed metadata
   - Smart diffing to reduce costs

## References

- [Mastra Documentation](https://mastra.ai)
- [OpenRouter Models](https://openrouter.ai/models)
- [Schema.org Specification](https://schema.org)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

---

**Last Updated:** 2025-11-16
**Version:** 1.0.0
**Author:** Keith Armstrong

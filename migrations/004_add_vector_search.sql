-- CurrentPrompt Database Migration
-- Migration 004: Vector Search Function
-- Created: 2025-11-16
-- Description: Add RPC function for semantic search using pgvector

-- Function to search modules by embedding similarity
-- Uses cosine distance (1 - cosine similarity)
-- Lower distance = more similar
CREATE OR REPLACE FUNCTION search_modules_by_embedding(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  category text,
  tags text[],
  summary_short text,
  summary_medium text,
  summary_long text,
  meta_title text,
  meta_description text,
  seo_keywords text[],
  schema_json jsonb,
  image_prompt text,
  quality_score int,
  validation_report jsonb,
  owner text,
  source_url text,
  source_label text,
  webflow_id text,
  latest_version int,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.slug,
    m.category,
    m.tags,
    m.summary_short,
    m.summary_medium,
    m.summary_long,
    m.meta_title,
    m.meta_description,
    m.seo_keywords,
    m.schema_json,
    m.image_prompt,
    m.quality_score,
    m.validation_report,
    m.owner,
    m.source_url,
    m.source_label,
    m.webflow_id,
    m.latest_version,
    m.status,
    m.created_at,
    m.updated_at,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM modules m
  INNER JOIN module_embeddings e ON m.id = e.module_id
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index on embeddings for faster vector search
CREATE INDEX IF NOT EXISTS idx_module_embeddings_vector
  ON module_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Note: For small datasets (<100k rows), the index might not be used
-- For production with more data, consider increasing lists parameter

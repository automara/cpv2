-- CurrentPrompt Database Schema
-- Migration 003: Fix Vector Dimensions
-- Created: 2025-11-16
-- Description: Update embeddings to 3072 dimensions for text-embedding-3-large
-- WARNING: This is a DESTRUCTIVE migration - existing embeddings will be deleted

-- Drop existing embeddings table
DROP TABLE IF EXISTS module_embeddings CASCADE;

-- Recreate with correct dimensions
CREATE TABLE module_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  embedding VECTOR(3072),  -- text-embedding-3-large produces 3072 dimensions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX idx_embeddings_vector ON module_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Add unique constraint to prevent duplicate embeddings per module
CREATE UNIQUE INDEX idx_module_embeddings_unique ON module_embeddings(module_id);

COMMENT ON TABLE module_embeddings IS 'Vector embeddings using OpenAI text-embedding-3-large (3072 dimensions)';

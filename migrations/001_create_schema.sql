-- CurrentPrompt Database Schema
-- Migration 001: Initial Schema
-- Created: 2025-11-16
-- Description: Core tables for modules, versions, and embeddings

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Core modules table
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Ownership
  owner TEXT DEFAULT 'Keith Armstrong',
  source_url TEXT,
  source_label TEXT,

  -- Webflow
  webflow_id TEXT,
  latest_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Version history table
CREATE TABLE module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changelog TEXT,
  file_paths JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, version)
);

-- Vector embeddings table (will be updated in migration 003)
CREATE TABLE module_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  embedding VECTOR(1536),  -- Temporary dimension, will be updated to 3072
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_modules_slug ON modules(slug);
CREATE INDEX idx_modules_category ON modules(category);
CREATE INDEX idx_modules_tags ON modules USING GIN(tags);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_created_at ON modules(created_at DESC);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

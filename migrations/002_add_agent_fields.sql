-- CurrentPrompt Database Schema
-- Migration 002: AI Agent Fields
-- Created: 2025-11-16
-- Description: Add AI-generated metadata fields to modules table

-- Add AI-generated summary fields
ALTER TABLE modules ADD COLUMN summary_short TEXT;
ALTER TABLE modules ADD COLUMN summary_medium TEXT;
ALTER TABLE modules ADD COLUMN summary_long TEXT;

-- Add SEO metadata fields
ALTER TABLE modules ADD COLUMN meta_title TEXT;
ALTER TABLE modules ADD COLUMN meta_description TEXT;
ALTER TABLE modules ADD COLUMN seo_keywords TEXT[];

-- Add advanced metadata fields
ALTER TABLE modules ADD COLUMN schema_json JSONB;
ALTER TABLE modules ADD COLUMN image_prompt TEXT;
ALTER TABLE modules ADD COLUMN quality_score INTEGER;
ALTER TABLE modules ADD COLUMN validation_report JSONB;

-- Create index for JSONB schema
CREATE INDEX idx_schema_json ON modules USING GIN(schema_json);

-- Add comment describing quality score range
COMMENT ON COLUMN modules.quality_score IS 'AI validation score from 0-100';

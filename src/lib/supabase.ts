import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types (will be expanded as we build the schema)
export interface Module {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];

  // AI-generated summaries
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;

  // SEO metadata
  meta_title?: string;
  meta_description?: string;
  seo_keywords?: string[];

  // Advanced metadata
  schema_json?: Record<string, any>;
  image_prompt?: string;
  quality_score?: number;
  validation_report?: Record<string, any>;

  // Ownership
  owner?: string;
  source_url?: string;
  source_label?: string;

  // Webflow
  webflow_id?: string;
  latest_version?: number;
  status?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface ModuleVersion {
  id: string;
  module_id: string;
  version: number;
  changelog?: string;
  file_paths?: Record<string, string>;
  created_at?: string;
}

export interface ModuleEmbedding {
  id: string;
  module_id: string;
  embedding: number[];
  created_at?: string;
}

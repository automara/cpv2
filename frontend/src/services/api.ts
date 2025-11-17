import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'x-api-key': API_KEY }),
  },
});

export interface Module {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;
  category?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  schema_org?: any;
  image_prompt?: string;
  quality_score?: number;
  status: 'draft' | 'published' | 'archived';
  webflow_id?: string;
  webflow_published_at?: string;
  version: number;
  changelog?: any[];
  created_at: string;
  updated_at: string;
}

export interface ModuleStats {
  total: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  avg_quality_score: number;
}

export interface AIProcessResult {
  summary_short: string;
  summary_medium: string;
  summary_long: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  category: string;
  tags: string[];
  schema_org: any;
  image_prompt: string;
  quality_score: number;
  validation_report: any;
  cost_estimate: number;
}

// Module APIs
export const modulesApi = {
  list: async (filters?: { category?: string; status?: string; search?: string; limit?: number; offset?: number }) => {
    const response = await api.get<{ modules: Module[]; total: number }>('/api/modules', { params: filters });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<Module>(`/api/modules/${id}`);
    return response.data;
  },

  create: async (data: { title: string; content: string }) => {
    const response = await api.post<Module>('/api/modules/create', data);
    return response.data;
  },

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<Module>('/api/modules/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: Partial<Module>) => {
    const response = await api.patch<Module>(`/api/modules/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/api/modules/${id}`);
  },

  stats: async () => {
    const response = await api.get<ModuleStats>('/api/modules/stats');
    return response.data;
  },

  search: async (query: string, limit?: number) => {
    const response = await api.post<{ results: Array<Module & { similarity: number }> }>('/api/modules/search', {
      query,
      limit,
    });
    return response.data;
  },

  versions: async (id: string) => {
    const response = await api.get<any[]>(`/api/modules/${id}/versions`);
    return response.data;
  },

  download: async (id: string) => {
    const response = await api.get(`/api/modules/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// AI APIs
export const aiApi = {
  process: async (content: string) => {
    const response = await api.post<AIProcessResult>('/api/ai/process', { content });
    return response.data;
  },

  test: async (content: string) => {
    const response = await api.post<AIProcessResult>('/api/ai/test', { content });
    return response.data;
  },

  estimateCost: async (content: string) => {
    const response = await api.post<{ estimated_cost: number }>('/api/ai/estimate-cost', { content });
    return response.data;
  },

  health: async () => {
    const response = await api.get<{ status: string; models: any }>('/api/ai/health');
    return response.data;
  },
};

// Webflow APIs
export const webflowApi = {
  health: async () => {
    const response = await api.get<any>('/api/webflow/health');
    return response.data;
  },

  sync: async (id: string) => {
    const response = await api.post<any>(`/api/webflow/sync/${id}`);
    return response.data;
  },

  syncBatch: async (filters?: { category?: string; status?: string }, delay?: number) => {
    const response = await api.post<any>('/api/webflow/sync-batch', { filters, delay });
    return response.data;
  },

  status: async (id: string) => {
    const response = await api.get<any>(`/api/webflow/status/${id}`);
    return response.data;
  },
};

export default api;

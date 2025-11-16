import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Input Validation Schemas using Zod
 *
 * Validates all user inputs to prevent injection attacks and ensure data quality
 */

// Module creation schema
export const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(100000), // 100KB max content
  sourceUrl: z.string().url().optional(),
  sourceLabel: z.string().max(100).optional(),
  owner: z.string().max(100).optional(),
});

// Module query parameters
export const moduleQuerySchema = z.object({
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
});

// Webflow sync schema
export const webflowSyncSchema = z.object({
  moduleId: z.string().uuid(),
  publishStatus: z.enum(['draft', 'published']).optional(),
});

// Test agent schema
export const testAgentSchema = z.object({
  content: z.string().min(10).max(100000),
  saveToDb: z.boolean().optional().default(false),
});

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return next(error);
    }
  };
}

/**
 * Query parameter validation middleware
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return next(error);
    }
  };
}

/**
 * Sanitization helpers
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}

export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

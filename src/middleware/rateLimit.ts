import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Configuration
 *
 * Tiered rate limits to prevent abuse and control costs:
 * - General API: 100 requests per 15 minutes
 * - Module creation: 10 requests per hour (prevents AI cost explosion)
 * - File upload: 5 requests per hour
 * - Webflow sync: 30 requests per hour
 * - Authenticated users: 3x multiplier
 */

// Helper to check if request is authenticated
function isAuthenticated(req: any): boolean {
  return req.authenticated === true;
}

// General API rate limit (100 req/15min)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => (isAuthenticated(req) ? 300 : 100),
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Module creation rate limit (10 req/hour, 30 if authenticated)
// This is critical to prevent cost explosions from AI processing
export const moduleCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => (isAuthenticated(req) ? 30 : 10),
  message: {
    error: 'Too many module creations',
    message: 'Module creation is rate-limited to prevent abuse. Please try again later.',
    hint: 'Authenticate to get higher limits',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// File upload rate limit (5 req/hour, 15 if authenticated)
export const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => (isAuthenticated(req) ? 15 : 5),
  message: {
    error: 'Too many file uploads',
    message: 'File upload is rate-limited. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webflow sync rate limit (30 req/hour, 90 if authenticated)
export const webflowSyncRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => (isAuthenticated(req) ? 90 : 30),
  message: {
    error: 'Too many sync requests',
    message: 'Webflow sync is rate-limited. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Test endpoint rate limit (higher limit for testing)
export const testRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => (isAuthenticated(req) ? 150 : 50),
  message: {
    error: 'Too many test requests',
    message: 'Please slow down your testing',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

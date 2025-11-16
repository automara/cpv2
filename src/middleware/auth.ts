import { Request, Response, NextFunction } from 'express';

/**
 * API Key Authentication Middleware
 *
 * Validates API key from Authorization header.
 * Format: Authorization: Bearer <API_KEY>
 *
 * If API_KEY env variable is not set, authentication is disabled.
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.API_KEY;

  // Skip auth if API_KEY is not configured
  if (!apiKey) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header',
    });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Authorization format. Use: Bearer <token>',
    });
  }

  if (token !== apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // Attach authenticated flag to request
  (req as any).authenticated = true;
  next();
}

/**
 * Optional authentication middleware
 * Checks for auth but doesn't block if missing
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (authHeader) {
    const [bearer, token] = authHeader.split(' ');
    if (bearer === 'Bearer' && token === apiKey) {
      (req as any).authenticated = true;
    }
  }

  next();
}

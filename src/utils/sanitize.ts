import DOMPurify from 'isomorphic-dompurify';

/**
 * Content Sanitization Utilities
 *
 * Uses DOMPurify to prevent XSS attacks in markdown and HTML content
 */

// Configuration for markdown content
const markdownConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'code', 'pre',
    'blockquote',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title',
    'class', 'id',
    'target', 'rel',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

// Configuration for plain text (strips all HTML)
const plainTextConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Sanitize markdown content
 * Allows safe HTML tags commonly used in markdown
 */
export function sanitizeMarkdown(content: string): string {
  if (!content) return '';
  return DOMPurify.sanitize(content, markdownConfig);
}

/**
 * Sanitize to plain text
 * Strips all HTML tags, keeping only text content
 */
export function sanitizeToPlainText(content: string): string {
  if (!content) return '';
  return DOMPurify.sanitize(content, plainTextConfig);
}

/**
 * Sanitize URL
 * Validates and sanitizes URLs to prevent javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Remove whitespace
  url = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lower = url.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lower.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, and mailto
  if (!/^(https?:|mailto:)/i.test(url)) {
    return '';
  }

  return url;
}

/**
 * Sanitize object (for JSON responses)
 * Recursively sanitizes all string values in an object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = sanitizeToPlainText(value);
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? sanitizeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    } else {
      // Pass through other types (numbers, booleans, null)
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

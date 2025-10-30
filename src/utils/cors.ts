/**
 * CORS configuration
 * Allows configuration via ALLOWED_ORIGINS environment variable
 * Falls back to * (allow all) if not set
 */

function getAllowedOrigin(): string {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  if (allowedOrigins) {
    // In production, you might want to check the origin header
    // For now, return the first origin or * if none specified
    return allowedOrigins.split(',')[0] || '*';
  }
  
  // Default to allow all (safe for most use cases)
  return '*';
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

export function corsHeadersGet() {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
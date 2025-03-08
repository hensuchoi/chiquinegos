import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate limit configurations
const RATE_LIMITS = {
  auth: { tokens: 5, interval: 60 }, // 5 attempts per minute
  business: { tokens: 10, interval: 60 }, // 10 requests per minute
  search: { tokens: 30, interval: 60 }, // 30 searches per minute
  review: { tokens: 5, interval: 60 }, // 5 reviews per minute
};

async function getRateLimit(ip: string, route: string) {
  const key = `rate_limit:${route}:${ip}`;
  const now = Date.now();
  const config = RATE_LIMITS[route as keyof typeof RATE_LIMITS];

  try {
    // Get current rate limit data
    const data = await redis.get(key);
    const rateLimit = data ? JSON.parse(data as string) : { tokens: config.tokens, last: now };

    // Calculate tokens to restore
    const timePassed = now - rateLimit.last;
    const tokensToRestore = Math.floor(timePassed / (config.interval * 1000)) * config.tokens;
    
    // Update tokens
    const newTokens = Math.min(config.tokens, rateLimit.tokens + tokensToRestore);
    
    // Check if we have tokens available
    if (newTokens < 1) {
      return false;
    }

    // Update rate limit
    await redis.set(key, JSON.stringify({
      tokens: newTokens - 1,
      last: now
    }), { ex: config.interval });

    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    return true; // Allow request if rate limiting fails
  }
}

export async function middleware(request: NextRequest) {
  const ip = request.ip || 'anonymous';
  const path = request.nextUrl.pathname;

  // Define routes to rate limit
  if (path.startsWith('/api/auth')) {
    if (!await getRateLimit(ip, 'auth')) {
      return new NextResponse(JSON.stringify({
        error: 'Demasiados intentos. Por favor, espere un momento.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  else if (path.startsWith('/api/business')) {
    if (!await getRateLimit(ip, 'business')) {
      return new NextResponse(JSON.stringify({
        error: 'Demasiadas solicitudes. Por favor, espere un momento.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  else if (path.includes('/api/search')) {
    if (!await getRateLimit(ip, 'search')) {
      return new NextResponse(JSON.stringify({
        error: 'Demasiadas búsquedas. Por favor, espere un momento.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  else if (path.includes('/api/review')) {
    if (!await getRateLimit(ip, 'review')) {
      return new NextResponse(JSON.stringify({
        error: 'Demasiadas reseñas. Por favor, espere un momento.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/business/:path*',
    '/api/search/:path*',
    '/api/review/:path*',
  ],
}; 
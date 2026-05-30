import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (resets on cold start — fine for Vercel Fluid Compute)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit login endpoints
  if (
    (pathname === '/login' || pathname === '/admin/login' || pathname === '/register') &&
    req.method === 'POST'
  ) {
    const key = getRateLimitKey(req);
    const now = Date.now();
    const entry = loginAttempts.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: 'Too many attempts. Try again in 15 minutes.' },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }
  }

  // Block direct access to /admin — redirect to /admin/login
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const res = NextResponse.next();

  // Extra security headers on admin routes
  if (pathname.startsWith('/admin')) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

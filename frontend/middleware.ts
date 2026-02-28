import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * next-intl middleware (without i18n routing).
 * We don't use locale-based URL segments (/vi/, /en/).
 * Locale is stored in a cookie and read server-side.
 *
 * This middleware only ensures the correct response headers are set.
 */
export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    // Only run on non-static paths
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

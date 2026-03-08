/**
 * Centralized security headers & CORS helpers.
 * Applied globally in dev-server.ts and per-handler in Vercel.
 */

// ─── Allowed Origins ──────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    // Add your Vercel production URL here, e.g.:
    // 'https://your-app.vercel.app',
]

// ─── CORS ─────────────────────────────────────────────────────────────────────

/**
 * Sets CORS headers on the response.
 * Uses specific allowed origins instead of wildcard so that
 * credentials (cookies) can be included safely.
 */
export function setCORSHeaders(
    req: { headers?: { origin?: string } },
    res: { setHeader: (k: string, v: string) => void },
    methods = 'GET, POST, OPTIONS'
): void {
    const requestOrigin = req.headers?.origin
    const allowedOrigin =
        requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
            ? requestOrigin
            : ALLOWED_ORIGINS[0]

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Access-Control-Allow-Methods', methods)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
}

// ─── Security Headers ─────────────────────────────────────────────────────────

/**
 * Adds HTTP security headers to prevent common web attacks:
 * - X-Content-Type-Options   → prevents MIME-type sniffing
 * - X-Frame-Options          → prevents clickjacking (no iframes)
 * - X-XSS-Protection         → legacy XSS filter for older browsers
 * - Referrer-Policy          → limits referrer information leakage
 * - Permissions-Policy       → restricts access to browser APIs
 */
export function setSecurityHeaders(res: {
    setHeader: (k: string, v: string) => void
}): void {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    )
}

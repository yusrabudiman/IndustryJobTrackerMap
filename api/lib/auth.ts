import { verifyToken, type JWTPayload } from '../../src/lib/jwt'
import type { VercelRequest } from '@vercel/node'

// ─── Cookie Parsing ───────────────────────────────────────────────────────────

function parseCookies(cookieHeader: string): Record<string, string> {
    const result: Record<string, string> = {}
    cookieHeader.split(';').forEach((cookie) => {
        const eqIdx = cookie.indexOf('=')
        if (eqIdx === -1) return
        const key = cookie.substring(0, eqIdx).trim()
        const val = cookie.substring(eqIdx + 1).trim()
        if (key) result[key] = val
    })
    return result
}

// ─── Token Extraction ─────────────────────────────────────────────────────────

/**
 * Reads JWT token from:
 *   1. HttpOnly cookie `auth_token` (preferred, secure)
 *   2. Authorization: Bearer <token> header (fallback)
 */
export function getTokenFromRequest(req: VercelRequest): string | null {
    // Priority 1: HttpOnly cookie
    const cookieHeader = req.headers.cookie as string | undefined
    if (cookieHeader) {
        const cookies = parseCookies(cookieHeader)
        if (cookies['auth_token']) return cookies['auth_token']
    }

    // Priority 2: Authorization header (fallback for API clients)
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }

    return null
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export async function getUserFromRequest(
    req: VercelRequest
): Promise<JWTPayload | null> {
    const token = getTokenFromRequest(req)
    if (!token) return null
    return verifyToken(token)
}

export async function getAdminFromRequest(
    req: VercelRequest
): Promise<JWTPayload | null> {
    const payload = await getUserFromRequest(req)
    if (!payload || payload.role !== 'ADMIN') return null
    return payload
}

// ─── Cookie Factories ─────────────────────────────────────────────────────────

const IS_PRODUCTION =
    process.env.NODE_ENV === 'production' ||
    !!process.env.VERCEL_ENV

/**
 * Creates a secure HttpOnly cookie string for the JWT token.
 * - HttpOnly: not accessible via JavaScript (prevents XSS theft)
 * - SameSite=Lax: protects against CSRF while allowing top-level nav
 * - Secure: only sent over HTTPS (applied in production)
 */
export function makeAuthCookie(token: string): string {
    const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
    let cookie = `auth_token=${token}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Path=/`
    if (IS_PRODUCTION) cookie += '; Secure'
    return cookie
}

/** Cookie that immediately expires, effectively clearing the auth session. */
export function makeClearCookie(): string {
    let cookie = `auth_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`
    if (IS_PRODUCTION) cookie += '; Secure'
    return cookie
}

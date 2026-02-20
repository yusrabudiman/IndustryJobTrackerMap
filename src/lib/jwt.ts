import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'job-tracker-secret-key-change-in-production-2026'
)

export interface JWTPayload {
    userId: string
    email: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return {
            userId: payload.userId as string,
            email: payload.email as string,
        }
    } catch {
        return null
    }
}

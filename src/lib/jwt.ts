import { SignJWT, jwtVerify } from 'jose'

const secret = process.env.JWT_SECRET
if (!secret) {
    throw new Error('JWT_SECRET must be defined in .env')
}
const JWT_SECRET = new TextEncoder().encode(secret)

export interface JWTPayload {
    userId: string
    email: string
    role: 'USER' | 'ADMIN'
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
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
            role: (payload.role as 'USER' | 'ADMIN') ?? 'USER',
        }
    } catch {
        return null
    }
}

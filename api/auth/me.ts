import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { getUserFromRequest } from '../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../lib/security'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'GET, OPTIONS')
    setSecurityHeaders(res)

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    try {
        // Reads token from HttpOnly cookie first, falls back to Authorization header
        const payload = await getUserFromRequest(req)
        if (!payload) {
            return res.status(401).json({ error: 'No valid session found' })
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account deactivated' })
        }

        return res.status(200).json({ user })
    } catch (error) {
        console.error('Auth/me error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

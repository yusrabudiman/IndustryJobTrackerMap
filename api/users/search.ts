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
        const payload = await getUserFromRequest(req)
        if (!payload) return res.status(401).json({ error: 'Unauthorized' })

        const { q } = req.query
        if (!q || typeof q !== 'string') return res.status(200).json([])

        // Limit search query length to prevent abuse
        const query = q.substring(0, 100)

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
                NOT: { id: payload.userId },
                isActive: true, // Only return active users
            },
            select: { id: true, name: true, email: true },
            take: 10,
        })

        return res.status(200).json(users)
    } catch (error) {
        console.error('User search error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

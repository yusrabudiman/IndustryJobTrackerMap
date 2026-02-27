import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { verifyToken } from '../../src/lib/jwt'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const authHeader = req.headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload) return res.status(401).json({ error: 'Invalid token' })

        const { q } = req.query
        if (!q || typeof q !== 'string') return res.status(200).json([])

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                ],
                NOT: { id: payload.userId }
            },
            select: { id: true, name: true, email: true },
            take: 10
        })

        return res.status(200).json(users)
    } catch (error) {
        console.error('User search error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

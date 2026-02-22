import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/lib/prisma'
import { verifyToken } from '../../../src/lib/jwt'

async function getAdminFromRequest(req: VercelRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') return null
    return payload
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const admin = await getAdminFromRequest(req)
    if (!admin) {
        return res.status(403).json({ error: 'Admin access required' })
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                _count: { select: { companies: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Summary stats
        const stats = {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.isActive).length,
            inactiveUsers: users.filter(u => !u.isActive).length,
            adminUsers: users.filter(u => u.role === 'ADMIN').length,
            neverLoggedIn: users.filter(u => !u.lastLoginAt).length,
        }

        return res.status(200).json({ users, stats })
    } catch (error) {
        console.error('Admin users list error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/lib/prisma'
import { getAdminFromRequest } from '../../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../../lib/security'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'GET, OPTIONS')
    setSecurityHeaders(res)

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

        const stats = {
            totalUsers: users.length,
            activeUsers: users.filter((u) => u.isActive).length,
            inactiveUsers: users.filter((u) => !u.isActive).length,
            adminUsers: users.filter((u) => u.role === 'ADMIN').length,
            neverLoggedIn: users.filter((u) => !u.lastLoginAt).length,
        }

        return res.status(200).json({ users, stats })
    } catch (error) {
        console.error('Admin users list error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

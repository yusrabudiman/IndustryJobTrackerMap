import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { verifyToken } from '../../src/lib/jwt'
import { z } from 'zod'

async function getUserFromRequest(req: VercelRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    return verifyToken(token)
}

const CompanyUpdateSchema = z.object({
    isPublic: z.boolean().optional(),
}).partial()

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, PATCH, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    const user = await getUserFromRequest(req)
    if (!user) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    const { id } = req.query

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid company ID' })
    }

    try {
        const existing = await prisma.company.findUnique({ where: { id } })
        if (!existing) {
            return res.status(404).json({ error: 'Company not found' })
        }

        // Only owner can modify/delete
        if (existing.userId !== user.userId) {
            return res.status(403).json({ error: 'Not authorized to modify this company' })
        }

        if (req.method === 'DELETE') {
            await prisma.company.delete({ where: { id } })
            return res.status(200).json({ message: 'Company deleted successfully' })
        }

        if (req.method === 'PATCH') {
            const validation = CompanyUpdateSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({ error: 'Validation failed' })
            }

            const updated = await prisma.company.update({
                where: { id },
                data: validation.data,
                include: { user: { select: { name: true } } },
            })
            return res.status(200).json(updated)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('API Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/lib/prisma'
import { verifyToken } from '../../../src/lib/jwt'
import { z } from 'zod'

async function getUserFromRequest(req: VercelRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    return verifyToken(token)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id: companyId } = req.query
    console.log(`[COMMENTS API] Method: ${req.method}, CompanyID: ${companyId}`)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') return res.status(200).end()

    if (typeof companyId !== 'string') {
        return res.status(400).json({ error: 'Invalid company ID' })
    }

    try {
        if (req.method === 'GET') {
            const comments = await prisma.comment.findMany({
                where: { companyId },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'asc' }
            })
            return res.status(200).json(comments)
        }

        if (req.method === 'POST') {
            const user = await getUserFromRequest(req)
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' })
            }

            const schema = z.object({
                content: z.string().min(1).max(1000),
                parentId: z.string().optional().nullable()
            })

            const validation = schema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({ error: 'Comment content is required' })
            }

            const comment = await prisma.comment.create({
                data: {
                    content: validation.data.content,
                    companyId,
                    userId: user.userId,
                    parentId: validation.data.parentId || undefined
                },
                include: { user: { select: { name: true } } }
            })

            return res.status(201).json(comment)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Comment API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

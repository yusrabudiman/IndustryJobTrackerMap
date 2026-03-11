import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/lib/prisma'
import { getUserFromRequest } from '../../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../../lib/security'
import { z } from 'zod'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'GET, POST, OPTIONS')
    setSecurityHeaders(res)

    if (req.method === 'OPTIONS') return res.status(200).end()

    const { id: companyId } = req.query

    if (typeof companyId !== 'string') {
        return res.status(400).json({ error: 'Invalid company ID' })
    }

    try {
        if (req.method === 'GET') {
            // Verify the company exists and check visibility
            const company = await prisma.company.findUnique({ where: { id: companyId } })
            if (!company) return res.status(404).json({ error: 'Company not found' })

            const user = await getUserFromRequest(req)

            // SEC-007 fix: only allow comments if company is public OR user is the owner
            if (!company.isPublic && company.userId !== user?.userId) {
                return res.status(403).json({ error: 'Access denied' })
            }

            const comments = await prisma.comment.findMany({
                where: { companyId },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'asc' },
            })
            return res.status(200).json(comments)
        }

        if (req.method === 'POST') {
            const user = await getUserFromRequest(req)
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' })
            }

            const schema = z.object({
                content: z.string().max(1000).optional(),
                parentId: z.string().optional().nullable(),
                images: z.array(z.string()).optional(),
            }).refine(data => {
                const hasContent = data.content && data.content.trim().length > 0;
                const hasImages = data.images && data.images.length > 0;
                return hasContent || hasImages;
            }, {
                message: "Either content or images must be provided"
            })

            const validation = schema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid comment data' })
            }

            const comment = await prisma.comment.create({
                data: {
                    content: validation.data.content || "",
                    companyId,
                    userId: user.userId,
                    parentId: validation.data.parentId || undefined,
                    images: validation.data.images || [],
                },
                include: { user: { select: { name: true } } },
            })

            return res.status(201).json(comment)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Comments API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

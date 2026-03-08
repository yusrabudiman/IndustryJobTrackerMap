import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { getUserFromRequest } from '../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../lib/security'
import { z } from 'zod'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'DELETE, PATCH, OPTIONS')
    setSecurityHeaders(res)

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
            const CompanyUpdateSchema = z.object({
                name: z.string().min(1).optional(),
                subSector: z.string().min(1).optional(),
                latitude: z.number().min(-90).max(90).optional(),
                longitude: z.number().min(-180).max(180).optional(),
                status: z.enum(['APPLIED', 'INTERVIEW', 'OFFERED', 'JOINED', 'REJECTED']).optional(),
                ratingSalary: z.number().int().min(1).max(5).optional(),
                ratingStability: z.number().int().min(1).max(5).optional(),
                ratingCulture: z.number().int().min(1).max(5).optional(),
                notes: z.string().optional().nullable(),
                isPublic: z.boolean().optional(),
            })

            const validation = CompanyUpdateSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                })
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
        console.error('Company update/delete error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

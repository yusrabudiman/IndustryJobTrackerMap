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
            console.log(`[PATCH] Updating company ${id}`, req.body)
            // Define schema for partial updates
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
                console.warn(`[PATCH] Validation failed for ${id}:`, validation.error.flatten().fieldErrors)
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                })
            }

            // Only update what was sent in the valid payload
            // This also ensures fields like 'id' or 'userId' are ignored
            try {
                const updated = await prisma.company.update({
                    where: { id },
                    data: validation.data,
                    include: { user: { select: { name: true } } },
                })
                console.log(`[PATCH] Successfully updated company ${id}`)
                return res.status(200).json(updated)
            } catch (dbError) {
                console.error(`[PATCH] Database error updating ${id}:`, dbError)
                throw dbError
            }
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('API Error Update:', error)
        // If it's a Prisma error, we might want more detail in logs
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

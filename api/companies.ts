import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../src/lib/prisma'
import { verifyToken } from '../src/lib/jwt'
import { z } from 'zod'

const CompanyCreateSchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    subSector: z.string().min(1, 'Sub-sector is required'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    status: z.enum(['APPLIED', 'INTERVIEW', 'OFFERED', 'JOINED', 'REJECTED']),
    ratingSalary: z.number().int().min(1).max(5),
    ratingStability: z.number().int().min(1).max(5),
    ratingCulture: z.number().int().min(1).max(5),
    notes: z.string().optional().nullable(),
    isPublic: z.boolean().default(false),
})

async function getUserFromRequest(req: VercelRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    return verifyToken(token)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    try {
        if (req.method === 'GET') {
            const user = await getUserFromRequest(req)

            if (!user) {
                // Not authenticated: only show public companies
                const companies = await prisma.company.findMany({
                    where: { isPublic: true },
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                })
                return res.status(200).json(companies)
            }

            // Authenticated: show own companies + other users' public companies
            const companies = await prisma.company.findMany({
                where: {
                    OR: [
                        { userId: user.userId },
                        { isPublic: true },
                    ],
                },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            })
            return res.status(200).json(companies)
        }

        if (req.method === 'POST') {
            const user = await getUserFromRequest(req)
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' })
            }

            const validation = CompanyCreateSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                })
            }

            const company = await prisma.company.create({
                data: {
                    ...validation.data,
                    userId: user.userId,
                },
                include: { user: { select: { name: true } } },
            })
            return res.status(201).json(company)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('API Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

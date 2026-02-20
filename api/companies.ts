import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../src/lib/prisma'
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
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    try {
        if (req.method === 'GET') {
            const companies = await prisma.company.findMany({
                orderBy: { createdAt: 'desc' },
            })
            return res.status(200).json(companies)
        }

        if (req.method === 'POST') {
            const validation = CompanyCreateSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                })
            }

            const company = await prisma.company.create({
                data: validation.data,
            })
            return res.status(201).json(company)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('API Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

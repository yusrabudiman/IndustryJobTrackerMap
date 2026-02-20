import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    const { id } = req.query

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid company ID' })
    }

    try {
        if (req.method === 'DELETE') {
            const existing = await prisma.company.findUnique({ where: { id } })
            if (!existing) {
                return res.status(404).json({ error: 'Company not found' })
            }

            await prisma.company.delete({ where: { id } })
            return res.status(200).json({ message: 'Company deleted successfully' })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('API Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

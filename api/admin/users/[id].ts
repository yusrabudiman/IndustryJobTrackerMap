import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/lib/prisma'
import { getAdminFromRequest } from '../../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../../lib/security'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const UpdateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[0-9]/, 'Must contain a number')
        .optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'GET, PATCH, DELETE, OPTIONS')
    setSecurityHeaders(res)

    if (req.method === 'OPTIONS') return res.status(200).end()

    const admin = await getAdminFromRequest(req)
    if (!admin) {
        return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.query

    try {
        if (req.method === 'GET') {
            const user = await prisma.user.findUnique({
                where: { id: id as string },
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
            })
            if (!user) return res.status(404).json({ error: 'User not found' })
            return res.status(200).json(user)
        }

        if (req.method === 'PATCH') {
            const validation = UpdateUserSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                })
            }

            const { newPassword, ...rest } = validation.data
            const updateData: Record<string, unknown> = { ...rest }

            if (newPassword) {
                updateData.password = await bcrypt.hash(newPassword, 12)
            }

            const updated = await prisma.user.update({
                where: { id: id as string },
                data: updateData,
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
            })
            return res.status(200).json(updated)
        }

        if (req.method === 'DELETE') {
            if (id === admin.userId) {
                return res.status(400).json({ error: 'Cannot delete your own admin account' })
            }

            await prisma.user.delete({ where: { id: id as string } })
            return res.status(200).json({ message: 'User deleted successfully' })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Admin user API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

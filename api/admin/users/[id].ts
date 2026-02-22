import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/lib/prisma'
import { verifyToken } from '../../../src/lib/jwt'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

async function getAdminFromRequest(req: VercelRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') return null
    return payload
}

const UpdateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
    newPassword: z.string().min(6).optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') return res.status(200).end()

    const admin = await getAdminFromRequest(req)
    if (!admin) {
        return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.query

    try {
        // GET /api/admin/users/:id — get single user detail
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

        // PATCH /api/admin/users/:id — update user (reset password, toggle active, change role)
        if (req.method === 'PATCH') {
            const validation = UpdateUserSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                })
            }

            const { newPassword, ...rest } = validation.data
            const updateData: any = { ...rest }

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

        // DELETE /api/admin/users/:id — delete user and all their companies
        if (req.method === 'DELETE') {
            // Prevent admin from deleting themselves
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

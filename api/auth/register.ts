import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { signToken } from '../../src/lib/jwt'
import { makeAuthCookie } from '../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../lib/security'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    // SEC-008 fix: stronger password requirements
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'POST, OPTIONS')
    setSecurityHeaders(res)

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const validation = RegisterSchema.safeParse(req.body)
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            })
        }

        const { name, email, password } = validation.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' })
        }

        // Hash password with bcrypt (cost factor 12)
        const hashedPassword = await bcrypt.hash(password, 12)

        // SEC-006 fix: use transaction to prevent race condition on first-user admin assignment
        const user = await prisma.$transaction(async (tx) => {
            const count = await tx.user.count()
            return tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: count === 0 ? 'ADMIN' : 'USER',
                },
            })
        })

        // Generate token
        const token = await signToken({ userId: user.id, email: user.email, role: user.role as 'USER' | 'ADMIN' })

        // Set token as HttpOnly cookie (prevents JS access — XSS safe)
        res.setHeader('Set-Cookie', makeAuthCookie(token))

        return res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })
    } catch (error) {
        console.error('Register error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

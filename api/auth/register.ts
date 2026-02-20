import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { signToken } from '../../src/lib/jwt'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        })

        // Generate token
        const token = await signToken({ userId: user.id, email: user.email })

        return res.status(201).json({
            token,
            user: { id: user.id, name: user.name, email: user.email },
        })
    } catch (error) {
        console.error('Register error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

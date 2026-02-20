import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { signToken } from '../../src/lib/jwt'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const validation = LoginSchema.safeParse(req.body)
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            })
        }

        const { email, password } = validation.data

        // Find user
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        // Generate token
        const token = await signToken({ userId: user.id, email: user.email })

        return res.status(200).json({
            token,
            user: { id: user.id, name: user.name, email: user.email },
        })
    } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

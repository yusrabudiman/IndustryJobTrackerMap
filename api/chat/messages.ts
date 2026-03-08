import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { getUserFromRequest } from '../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../lib/security'
import { z } from 'zod'

const MessageSchema = z.object({
    content: z.string().min(1, 'Content required').max(5000, 'Message too long'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'GET, POST, OPTIONS')
    setSecurityHeaders(res)

    if (req.method === 'OPTIONS') return res.status(200).end()

    try {
        const payload = await getUserFromRequest(req)
        if (!payload) return res.status(401).json({ error: 'Unauthorized' })

        const userId = payload.userId
        const { conversationId } = req.query

        if (!conversationId || typeof conversationId !== 'string') {
            return res.status(400).json({ error: 'Conversation ID required' })
        }

        // Verify user is a participant before any action
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: { some: { id: userId } }
            }
        })

        if (!conversation) return res.status(403).json({ error: 'Access denied' })

        if (req.method === 'GET') {
            const messages = await prisma.message.findMany({
                where: { conversationId },
                include: { sender: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'asc' }
            })
            return res.status(200).json(messages)
        }

        if (req.method === 'POST') {
            const validation = MessageSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({ error: 'Message content is required (max 5000 chars)' })
            }

            const message = await prisma.message.create({
                data: {
                    content: validation.data.content,
                    senderId: userId,
                    conversationId,
                },
                include: { sender: { select: { id: true, name: true } } }
            })

            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date(), lastMessageAt: new Date() }
            })

            return res.status(201).json(message)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Messages API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { verifyToken } from '../../src/lib/jwt'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') return res.status(200).end()

    try {
        const authHeader = req.headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload) return res.status(401).json({ error: 'Invalid token' })

        const userId = payload.userId
        const { conversationId } = req.query

        if (!conversationId) return res.status(400).json({ error: 'Conversation ID required' })

        // Check if user is participant
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId as string,
                participants: { some: { id: userId } }
            }
        })

        if (!conversation) return res.status(403).json({ error: 'Access denied' })

        if (req.method === 'GET') {
            const messages = await prisma.message.findMany({
                where: { conversationId: conversationId as string },
                include: { sender: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'asc' }
            })
            return res.status(200).json(messages)
        }

        if (req.method === 'POST') {
            const { content } = req.body
            if (!content) return res.status(400).json({ error: 'Message content required' })

            const message = await prisma.message.create({
                data: {
                    content,
                    senderId: userId,
                    conversationId: conversationId as string
                },
                include: { sender: { select: { id: true, name: true } } }
            })

            // Update conversation lastMessageAt and updatedAt
            await prisma.conversation.update({
                where: { id: conversationId as string },
                data: {
                    updatedAt: new Date(),
                    lastMessageAt: new Date()
                }
            })

            return res.status(201).json(message)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Messages API Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

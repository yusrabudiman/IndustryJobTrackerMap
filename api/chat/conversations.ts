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

        if (req.method === 'GET') {
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        some: { id: userId }
                    }
                },
                include: {
                    participants: {
                        select: { id: true, name: true }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: { sender: { select: { name: true } } }
                    }
                },
                orderBy: { lastMessageAt: 'desc' }
            })
            return res.status(200).json(conversations)
        }

        if (req.method === 'POST') {
            const { participantId } = req.body
            if (!participantId) return res.status(400).json({ error: 'Participant ID required' })
            if (participantId === userId) return res.status(400).json({ error: 'Cannot chat with yourself' })

            // Check if conversation already exists
            const existing = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { participants: { some: { id: userId } } },
                        { participants: { some: { id: participantId } } }
                    ]
                },
                include: {
                    participants: { select: { id: true, name: true } }
                }
            })

            if (existing) return res.status(200).json(existing)

            const conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        connect: [{ id: userId }, { id: participantId }]
                    }
                },
                include: {
                    participants: { select: { id: true, name: true } }
                }
            })
            return res.status(201).json(conversation)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Chat API Error:', error)
        return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : String(error) })
    }
}

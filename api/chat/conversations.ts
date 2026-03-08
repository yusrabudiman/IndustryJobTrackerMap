import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'
import { getUserFromRequest } from '../lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../lib/security'
import { z } from 'zod'

const ParticipantSchema = z.object({
    participantId: z.string().uuid('Invalid participant ID format'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'GET, POST, OPTIONS')
    setSecurityHeaders(res)

    if (req.method === 'OPTIONS') return res.status(200).end()

    try {
        const payload = await getUserFromRequest(req)
        if (!payload) return res.status(401).json({ error: 'Unauthorized' })

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
            // SEC-012 fix: validate participantId format
            const validation = ParticipantSchema.safeParse(req.body)
            if (!validation.success) {
                return res.status(400).json({ error: 'Valid participant ID (UUID) is required' })
            }

            const { participantId } = validation.data
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
        console.error('Conversations API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'

// Import Vercel-style handlers
import companiesHandler from './api/companies'
import companyByIdHandler from './api/companies/[id]'
import commentsHandler from './api/companies/[id]/comments'
import registerHandler from './api/auth/register'
import loginHandler from './api/auth/login'
import meHandler from './api/auth/me'
import adminUsersHandler from './api/admin/users/index'
import adminUserByIdHandler from './api/admin/users/[id]'
import chatConversationsHandler from './api/chat/conversations'
import chatMessagesHandler from './api/chat/messages'
import userSearchHandler from './api/users/search'

const PORT = 3001

// Minimal adapter: convert Node.js IncomingMessage → VercelRequest-like shape
function parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk: Buffer) => {
            data += chunk.toString()
        })
        req.on('end', () => {
            if (data) {
                try {
                    resolve(JSON.parse(data))
                } catch {
                    resolve(data)
                }
            } else {
                resolve(undefined)
            }
        })
        req.on('error', reject)
    })
}

function createMockRes(res: http.ServerResponse) {
    const mockRes: any = {
        _headers: {} as Record<string, string>,
        _statusCode: 200,
        setHeader(key: string, value: string) {
            mockRes._headers[key] = value
            return mockRes
        },
        status(code: number) {
            mockRes._statusCode = code
            return mockRes
        },
        json(data: any) {
            res.writeHead(mockRes._statusCode, {
                'Content-Type': 'application/json',
                ...mockRes._headers,
            })
            res.end(JSON.stringify(data))
        },
        end() {
            res.writeHead(mockRes._statusCode, mockRes._headers)
            res.end()
        },
    }
    return mockRes
}

const server = http.createServer(async (req, res) => {
    const mockRes = createMockRes(res)

    try {
        const url = new URL(req.url || '/', `http://localhost:${PORT}`)
        const pathname = url.pathname
        console.log(`[DEV] ${req.method} ${pathname}`)

        let body;
        try {
            body = await parseBody(req)
        } catch (bodyError) {
            console.error('[DEV] Body parsing error:', bodyError)
            return mockRes.status(400).json({ error: 'Invalid request body' })
        }

        const mockReq: any = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: Object.fromEntries(url.searchParams),
            body,
        }

        // Route: /api/auth/register
        if (pathname === '/api/auth/register') {
            await registerHandler(mockReq, mockRes)
            return
        }

        // Route: /api/auth/login
        if (pathname === '/api/auth/login') {
            console.log('[DEV] Handling login...')
            await loginHandler(mockReq, mockRes)
            console.log('[DEV] Login handled successfully')
            return
        }

        // Route: /api/auth/me
        if (pathname === '/api/auth/me') {
            await meHandler(mockReq, mockRes)
            return
        }

        // Route: /api/admin/users/:id
        const adminUserIdMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/)
        if (adminUserIdMatch) {
            mockReq.query.id = adminUserIdMatch[1]
            await adminUserByIdHandler(mockReq, mockRes)
            return
        }

        // Route: /api/admin/users
        if (pathname === '/api/admin/users') {
            await adminUsersHandler(mockReq, mockRes)
            return
        }

        // Route: /api/companies/:id/comments
        const commentsMatch = pathname.match(/^\/api\/companies\/([^/]+)\/comments\/?$/)
        if (commentsMatch) {
            console.log(`[DEV] Matched Comments Route for ID: ${commentsMatch[1]}`)
            mockReq.query.id = commentsMatch[1]
            await commentsHandler(mockReq, mockRes)
            return
        }

        // Route: /api/companies/:id
        const idMatch = pathname.match(/^\/api\/companies\/([^/]+)$/)
        if (idMatch) {
            mockReq.query.id = idMatch[1]
            await companyByIdHandler(mockReq, mockRes)
            return
        }

        // Route: /api/companies
        if (pathname === '/api/companies') {
            await companiesHandler(mockReq, mockRes)
            return
        }

        // Route: /api/chat/conversations
        if (pathname === '/api/chat/conversations') {
            await chatConversationsHandler(mockReq, mockRes)
            return
        }

        // Route: /api/chat/messages
        if (pathname === '/api/chat/messages') {
            await chatMessagesHandler(mockReq, mockRes)
            return
        }

        // Route: /api/users/search
        if (pathname === '/api/users/search') {
            await userSearchHandler(mockReq, mockRes)
            return
        }

        // 404
        console.warn(`[DEV] !!! 404 Not Found !!! Path: "${pathname}" Method: ${req.method}`)
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found', path: pathname }))
    } catch (error) {
        console.error('[DEV] Server error:', error)
        if (!res.writableEnded) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error)
            }))
        }
    }
})

// === Socket.io Setup ===
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`)

    socket.on('join_room', (conversationId) => {
        socket.join(conversationId)
        console.log(`[SOCKET] User ${socket.id} joined room: ${conversationId}`)
    })

    socket.on('send_message', (data) => {
        // data should contain: conversationId, content, senderId, senderName, etc.
        console.log(`[SOCKET] Message received in ${data.conversationId}:`, data.content)

        // Broadcast to everyone in the room
        io.to(data.conversationId).emit('receive_message', data)
    })

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`)
    })
})

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n  🚀 API dev server running at http://127.0.0.1:${PORT}\n`)
})

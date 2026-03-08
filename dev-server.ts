import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import { verifyToken } from './src/lib/jwt'
import { prisma } from './src/lib/prisma'

// Import Vercel-style handlers
import companiesHandler from './api/companies'
import companyByIdHandler from './api/companies/[id]'
import commentsHandler from './api/companies/[id]/comments'
import registerHandler from './api/auth/register'
import loginHandler from './api/auth/login'
import logoutHandler from './api/auth/logout'
import meHandler from './api/auth/me'
import adminUsersHandler from './api/admin/users/index'
import adminUserByIdHandler from './api/admin/users/[id]'
import chatConversationsHandler from './api/chat/conversations'
import chatMessagesHandler from './api/chat/messages'
import userSearchHandler from './api/users/search'

const PORT = 3001

// ─── Request Body Parser ──────────────────────────────────────────────────────

function parseBody(req: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk: Buffer) => { data += chunk.toString() })
        req.on('end', () => {
            if (data) {
                try { resolve(JSON.parse(data)) }
                catch { resolve(data) }
            } else {
                resolve(undefined)
            }
        })
        req.on('error', reject)
    })
}

// ─── Response Adapter ─────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

function createMockRes(req: http.IncomingMessage, res: http.ServerResponse) {
    // Resolve allowed CORS origin
    const requestOrigin = req.headers['origin'] as string | undefined
    const corsOrigin =
        requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
            ? requestOrigin
            : ALLOWED_ORIGINS[0]

    const mockRes: any = {
        _headers: {} as Record<string, string | string[]>,
        _statusCode: 200,
        setHeader(key: string, value: string | string[]) {
            mockRes._headers[key] = value
            return mockRes
        },
        status(code: number) {
            mockRes._statusCode = code
            return mockRes
        },
        json(data: unknown) {
            const headers: http.OutgoingHttpHeaders = {
                'Content-Type': 'application/json',
                // Security headers (applied globally, override any handler values)
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
                // CORS with credentials support (specific origin, not wildcard)
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Vary': 'Origin',
                // Merge handler-set headers (e.g. Set-Cookie for auth)
                ...mockRes._headers,
            }
            res.writeHead(mockRes._statusCode, headers)
            res.end(JSON.stringify(data))
        },
        end() {
            const headers: http.OutgoingHttpHeaders = {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Vary': 'Origin',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                ...mockRes._headers,
            }
            res.writeHead(mockRes._statusCode, headers)
            res.end()
        },
    }
    return mockRes
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
    const mockRes = createMockRes(req, res)

    try {
        const url = new URL(req.url || '/', `http://localhost:${PORT}`)
        const pathname = url.pathname

        // Handle preflight globally before body parsing
        if (req.method === 'OPTIONS') {
            return mockRes.status(200).end()
        }

        let body: unknown
        try {
            body = await parseBody(req)
        } catch {
            return mockRes.status(400).json({ error: 'Invalid request body' })
        }

        const mockReq: any = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: Object.fromEntries(url.searchParams),
            body,
        }

        // ── Auth routes ──────────────────────────────────────────────────────
        if (pathname === '/api/auth/register') {
            await registerHandler(mockReq, mockRes)
            return
        }
        if (pathname === '/api/auth/login') {
            await loginHandler(mockReq, mockRes)
            return
        }
        if (pathname === '/api/auth/logout') {
            await logoutHandler(mockReq, mockRes)
            return
        }
        if (pathname === '/api/auth/me') {
            await meHandler(mockReq, mockRes)
            return
        }

        // ── Admin routes ─────────────────────────────────────────────────────
        const adminUserIdMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/)
        if (adminUserIdMatch) {
            mockReq.query.id = adminUserIdMatch[1]
            await adminUserByIdHandler(mockReq, mockRes)
            return
        }
        if (pathname === '/api/admin/users') {
            await adminUsersHandler(mockReq, mockRes)
            return
        }

        // ── Company routes ───────────────────────────────────────────────────
        const commentsMatch = pathname.match(/^\/api\/companies\/([^/]+)\/comments\/?$/)
        if (commentsMatch) {
            mockReq.query.id = commentsMatch[1]
            await commentsHandler(mockReq, mockRes)
            return
        }
        const companyIdMatch = pathname.match(/^\/api\/companies\/([^/]+)$/)
        if (companyIdMatch) {
            mockReq.query.id = companyIdMatch[1]
            await companyByIdHandler(mockReq, mockRes)
            return
        }
        if (pathname === '/api/companies') {
            await companiesHandler(mockReq, mockRes)
            return
        }

        // ── Chat routes ──────────────────────────────────────────────────────
        if (pathname === '/api/chat/conversations') {
            await chatConversationsHandler(mockReq, mockRes)
            return
        }
        if (pathname === '/api/chat/messages') {
            await chatMessagesHandler(mockReq, mockRes)
            return
        }

        // ── User routes ──────────────────────────────────────────────────────
        if (pathname === '/api/users/search') {
            await userSearchHandler(mockReq, mockRes)
            return
        }

        // 404
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found' }))
    } catch (error) {
        console.error('[SERVER] Unhandled error:', error instanceof Error ? error.message : error)
        if (!res.writableEnded) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error' }))
        }
    }
})

// ─── Socket.IO ────────────────────────────────────────────────────────────────

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST'],
    },
})

// SEC-003 fix: authenticate socket connections via JWT
io.use(async (socket, next) => {
    try {
        // Accept token from auth handshake payload or cookie
        const token =
            socket.handshake.auth?.token ||
            (() => {
                const cookieHeader = socket.handshake.headers.cookie || ''
                const match = cookieHeader.match(/auth_token=([^;]+)/)
                return match ? match[1] : null
            })()

        if (!token) return next(new Error('Authentication required'))

        const payload = await verifyToken(token)
        if (!payload) return next(new Error('Invalid or expired token'))

        // Attach verified user info to socket
        socket.data.userId = payload.userId
        socket.data.userRole = payload.role
        next()
    } catch {
        next(new Error('Authentication error'))
    }
})

io.on('connection', (socket) => {
    const userId = socket.data.userId

    socket.on('join_room', async (conversationId: string) => {
        try {
            // SEC-003 fix: verify user is actually a participant of this conversation
            const conv = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    participants: { some: { id: userId } },
                },
            })
            if (!conv) {
                socket.emit('error', { message: 'Access denied to this conversation' })
                return
            }
            socket.join(conversationId)
        } catch {
            socket.emit('error', { message: 'Failed to join room' })
        }
    })

    socket.on('send_message', (data: { conversationId: string; content: string }) => {
        if (!data.conversationId || !data.content) return

        // Broadcast with the verified server-side userId (not client-supplied)
        io.to(data.conversationId).emit('receive_message', {
            ...data,
            senderId: userId, // Always use server-verified userId
        })
    })

    socket.on('disconnect', () => {
        // Intentionally silent — no need to log every disconnect
    })
})

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n  🚀 Dev API server: http://127.0.0.1:${PORT}`)
    console.log(`  🔐 Security: HttpOnly cookies, CORS restricted, Socket.IO auth enabled\n`)
})

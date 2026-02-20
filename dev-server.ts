import 'dotenv/config'
import http from 'http'

// Import Vercel-style handlers
import companiesHandler from './api/companies'
import companyByIdHandler from './api/companies/[id]'
import registerHandler from './api/auth/register'
import loginHandler from './api/auth/login'
import meHandler from './api/auth/me'

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
    const url = new URL(req.url || '/', `http://localhost:${PORT}`)
    const pathname = url.pathname
    const body = await parseBody(req)

    const mockReq: any = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: Object.fromEntries(url.searchParams),
        body,
    }

    const mockRes = createMockRes(res)

    try {
        // Route: /api/auth/register
        if (pathname === '/api/auth/register') {
            await registerHandler(mockReq, mockRes)
            return
        }

        // Route: /api/auth/login
        if (pathname === '/api/auth/login') {
            await loginHandler(mockReq, mockRes)
            return
        }

        // Route: /api/auth/me
        if (pathname === '/api/auth/me') {
            await meHandler(mockReq, mockRes)
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

        // 404
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found' }))
    } catch (error) {
        console.error('Dev server error:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
    }
})

server.listen(PORT, () => {
    console.log(`\n  🚀 API dev server running at http://localhost:${PORT}\n`)
})

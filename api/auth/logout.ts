import type { VercelRequest, VercelResponse } from '@vercel/node'
import { makeClearCookie } from '../../api/lib/auth'
import { setCORSHeaders, setSecurityHeaders } from '../../api/lib/security'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(req, res, 'POST, OPTIONS')
    setSecurityHeaders(res)

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    // Clear the auth cookie by setting Max-Age=0
    res.setHeader('Set-Cookie', makeClearCookie())
    return res.status(200).json({ message: 'Logged out successfully' })
}

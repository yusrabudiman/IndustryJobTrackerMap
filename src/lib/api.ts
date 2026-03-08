import type { Company, CompanyInput, AuthResponse, User, AdminUser, AdminStats, Comment } from '../types/company'

const API_BASE = '/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function safeJson(res: Response) {
    const text = await res.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        throw new Error(`Invalid JSON response: ${text.substring(0, 80)}`)
    }
}

/**
 * Default fetch options: always include credentials so the browser
 * automatically sends the HttpOnly auth cookie with every request.
 * No manual token handling needed — the cookie is invisible to JS (XSS-safe).
 */
function defaultOptions(extra: RequestInit = {}): RequestInit {
    return {
        credentials: 'include', // Send HttpOnly cookie automatically
        ...extra,
        headers: {
            'Content-Type': 'application/json',
            ...(extra.headers ?? {}),
        },
    }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, defaultOptions({
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    }))
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Registration failed')
    return data
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, defaultOptions({
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }))
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Login failed')
    return data
}

export async function getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, defaultOptions())
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Not authenticated')
    return data.user
}

/** Calls the server to clear the HttpOnly auth cookie. */
export async function logoutUser(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, defaultOptions({ method: 'POST' }))
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
    const res = await fetch(`${API_BASE}/companies`, defaultOptions())
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch companies')
    return data
}

export async function createCompany(data: CompanyInput): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies`, defaultOptions({
        method: 'POST',
        body: JSON.stringify(data),
    }))
    const responseData = await safeJson(res)
    if (!res.ok) throw new Error(responseData?.error || 'Failed to create company')
    return responseData
}

export async function deleteCompany(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/companies/${id}`, defaultOptions({ method: 'DELETE' }))
    if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data?.error || 'Failed to delete company')
    }
}

export async function toggleCompanyVisibility(id: string, isPublic: boolean): Promise<Company> {
    return updateCompany(id, { isPublic })
}

export async function updateCompany(id: string, data: Partial<CompanyInput>): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies/${id}`, defaultOptions({
        method: 'PATCH',
        body: JSON.stringify(data),
    }))
    const responseData = await safeJson(res)
    if (!res.ok) throw new Error(responseData?.error || 'Failed to update company')
    return responseData
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(companyId: string): Promise<Comment[]> {
    const res = await fetch(`${API_BASE}/companies/${companyId}/comments`, defaultOptions())
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch comments')
    return data
}

export async function addComment(companyId: string, content: string, parentId?: string | null): Promise<Comment> {
    const res = await fetch(`${API_BASE}/companies/${companyId}/comments`, defaultOptions({
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
    }))
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to add comment')
    return data
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminUsers(): Promise<{ users: AdminUser[]; stats: AdminStats }> {
    const res = await fetch(`${API_BASE}/admin/users`, defaultOptions())
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch users')
    return data
}

export async function updateAdminUser(
    id: string,
    data: { name?: string; email?: string; role?: 'USER' | 'ADMIN'; isActive?: boolean; newPassword?: string }
): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, defaultOptions({
        method: 'PATCH',
        body: JSON.stringify(data),
    }))
    const responseData = await safeJson(res)
    if (!res.ok) throw new Error(responseData?.error || 'Failed to update user')
    return responseData
}

export async function deleteAdminUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, defaultOptions({ method: 'DELETE' }))
    if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data?.error || 'Failed to delete user')
    }
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function getConversations() {
    const res = await fetch(`${API_BASE}/chat/conversations`, defaultOptions())
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch conversations')
    return data
}

export async function getMessages(conversationId: string) {
    const res = await fetch(`${API_BASE}/chat/messages?conversationId=${conversationId}`, defaultOptions())
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch messages')
    return data
}

export async function createConversation(participantId: string) {
    const res = await fetch(`${API_BASE}/chat/conversations`, defaultOptions({
        method: 'POST',
        body: JSON.stringify({ participantId }),
    }))
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to create conversation')
    return data
}

export async function sendMessage(conversationId: string, content: string) {
    const res = await fetch(`${API_BASE}/chat/messages?conversationId=${conversationId}`, defaultOptions({
        method: 'POST',
        body: JSON.stringify({ content }),
    }))
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to send message')
    return data
}

export async function searchUsers(query: string) {
    const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`, defaultOptions())
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to search users')
    return data
}

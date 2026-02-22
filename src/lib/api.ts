import type { Company, CompanyInput, AuthResponse, User, AdminUser, AdminStats } from '../types/company'

const API_BASE = '/api'

async function safeJson(res: Response) {
    const text = await res.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch (e) {
        throw new Error(`Invalid JSON response from server: ${text.substring(0, 50)}...`)
    }
}

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

// ─── Auth ────────────────────────────────────────────────────
export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    })
    const data = await safeJson(res)
    if (!res.ok) {
        throw new Error(data?.error || 'Registration failed')
    }
    return data
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    const data = await safeJson(res)
    if (!res.ok) {
        throw new Error(data?.error || 'Login failed')
    }
    return data
}

export async function getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Not authenticated')
    return data.user
}

// ─── Companies ───────────────────────────────────────────────
export async function getCompanies(): Promise<Company[]> {
    const res = await fetch(`${API_BASE}/companies`, {
        headers: getAuthHeaders(),
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch companies')
    return data
}

export async function createCompany(data: CompanyInput): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    })
    const responseData = await safeJson(res)
    if (!res.ok) {
        throw new Error(responseData?.error || 'Failed to create company')
    }
    return responseData
}

export async function deleteCompany(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data?.error || 'Failed to delete company')
    }
}

export async function toggleCompanyVisibility(id: string, isPublic: boolean): Promise<Company> {
    return updateCompany(id, { isPublic })
}

export async function updateCompany(id: string, data: Partial<CompanyInput>): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    })
    const responseData = await safeJson(res)
    if (!res.ok) throw new Error(responseData?.error || 'Failed to update company')
    return responseData
}

// ─── Admin ───────────────────────────────────────────────────
export async function getAdminUsers(): Promise<{ users: AdminUser[]; stats: AdminStats }> {
    const res = await fetch(`${API_BASE}/admin/users`, {
        headers: getAuthHeaders(),
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch users')
    return data
}

export async function updateAdminUser(
    id: string,
    data: { name?: string; email?: string; role?: 'USER' | 'ADMIN'; isActive?: boolean; newPassword?: string }
): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    })
    const responseData = await safeJson(res)
    if (!res.ok) throw new Error(responseData?.error || 'Failed to update user')
    return responseData
}

export async function deleteAdminUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data?.error || 'Failed to delete user')
    }
}

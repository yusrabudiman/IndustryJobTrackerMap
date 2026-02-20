import type { Company, CompanyInput, AuthResponse, User } from '../types/company'

const API_BASE = '/api'

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
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Registration failed')
    }
    return res.json()
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Login failed')
    }
    return res.json()
}

export async function getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Not authenticated')
    const data = await res.json()
    return data.user
}

// ─── Companies ───────────────────────────────────────────────
export async function getCompanies(): Promise<Company[]> {
    const res = await fetch(`${API_BASE}/companies`, {
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch companies')
    return res.json()
}

export async function createCompany(data: CompanyInput): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create company')
    }
    return res.json()
}

export async function deleteCompany(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete company')
}

export async function toggleCompanyVisibility(id: string, isPublic: boolean): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isPublic }),
    })
    if (!res.ok) throw new Error('Failed to update visibility')
    return res.json()
}

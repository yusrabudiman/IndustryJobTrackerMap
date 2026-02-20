import type { Company, CompanyInput } from '../types/company'

const API_BASE = '/api'

export async function getCompanies(): Promise<Company[]> {
    const res = await fetch(`${API_BASE}/companies`)
    if (!res.ok) throw new Error('Failed to fetch companies')
    return res.json()
}

export async function createCompany(data: CompanyInput): Promise<Company> {
    const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    })
    if (!res.ok) throw new Error('Failed to delete company')
}

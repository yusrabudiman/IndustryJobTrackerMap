export enum CompanyStatus {
    APPLIED = 'APPLIED',
    INTERVIEW = 'INTERVIEW',
    OFFERED = 'OFFERED',
    JOINED = 'JOINED',
    REJECTED = 'REJECTED',
}

export interface Comment {
    id: string
    content: string
    createdAt: string
    userId: string
    user: { name: string }
    companyId: string
    parentId?: string | null
}

export interface Company {
    id: string
    name: string
    subSector: string
    latitude: number
    longitude: number
    status: CompanyStatus
    ratingSalary: number
    ratingStability: number
    ratingCulture: number
    notes: string | null
    isPublic: boolean
    createdAt: string
    userId: string
    user?: { name: string }
    comments?: Comment[]
}

export type CompanyInput = Omit<Company, 'id' | 'createdAt' | 'userId' | 'user'>

export interface User {
    id: string
    name: string
    email: string
    role: 'USER' | 'ADMIN'
}

export interface AdminUser {
    id: string
    name: string
    email: string
    role: 'USER' | 'ADMIN'
    isActive: boolean
    lastLoginAt: string | null
    createdAt: string
    _count: { companies: number }
}

export interface AdminStats {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    adminUsers: number
    neverLoggedIn: number
}

export interface AuthResponse {
    token: string
    user: User
}

export const STATUS_COLORS: Record<CompanyStatus, string> = {
    [CompanyStatus.JOINED]: '#22c55e',
    [CompanyStatus.OFFERED]: '#22c55e',
    [CompanyStatus.INTERVIEW]: '#eab308',
    [CompanyStatus.APPLIED]: '#9ca3af',
    [CompanyStatus.REJECTED]: '#ef4444',
}

export const STATUS_LABELS: Record<CompanyStatus, string> = {
    [CompanyStatus.APPLIED]: 'Applied',
    [CompanyStatus.INTERVIEW]: 'Interview',
    [CompanyStatus.OFFERED]: 'Offered',
    [CompanyStatus.JOINED]: 'Joined',
    [CompanyStatus.REJECTED]: 'Rejected',
}

export const SUB_SECTORS = ['FMCG', 'Retail F&B', 'Manufacturing', 'Startup', 'Restaurant Chain', 'Catering', 'Food Tech'] as const

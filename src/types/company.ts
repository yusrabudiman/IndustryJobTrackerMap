export enum CompanyStatus {
    APPLIED = 'APPLIED',
    INTERVIEW = 'INTERVIEW',
    OFFERED = 'OFFERED',
    JOINED = 'JOINED',
    REJECTED = 'REJECTED',
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
    createdAt: string
}

export type CompanyInput = Omit<Company, 'id' | 'createdAt'>

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

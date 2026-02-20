import { useState } from 'react'
import type { Company } from '../types/company'
import { CompanyStatus, STATUS_COLORS, STATUS_LABELS } from '../types/company'

interface CompanyListProps {
    companies: Company[]
    onDelete: (id: string) => void
    onToggleVisibility: (id: string, isPublic: boolean) => void
    onSelect: (company: Company) => void
    isDeleting: string | null
    currentUserId: string | null
}

function getAverageRating(c: Company): string {
    return ((c.ratingSalary + c.ratingStability + c.ratingCulture) / 3).toFixed(1)
}

interface CompanyCardProps {
    company: Company
    isOwner: boolean
    onSelect: (c: Company) => void
    onToggleVisibility: (id: string, pub: boolean) => void
    onDelete: (id: string) => void
    isDeleting: boolean
}

function CompanyCard({ company, isOwner, onSelect, onToggleVisibility, onDelete, isDeleting }: CompanyCardProps) {
    return (
        <div
            onClick={() => onSelect(company)}
            className="group p-3 rounded-xl bg-surface/70 border border-border/30 hover:border-primary/40 transition-all duration-200 hover:bg-surface-lighter/30 cursor-pointer active:scale-[0.98]"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-text truncate">{company.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-text-muted">{company.subSector}</p>
                        {!isOwner && company.user && (
                            <span className="text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full">
                                by {company.user.name}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isOwner && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(company.id, !company.isPublic); }}
                            className="text-xs px-2 py-1 rounded-md cursor-pointer transition-colors duration-200 hover:bg-surface-lighter/50"
                            title={company.isPublic ? 'Make Private' : 'Make Public'}
                        >
                            {company.isPublic ? '🌍' : '🔒'}
                        </button>
                    )}
                    {isOwner && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(company.id); }}
                            disabled={isDeleting}
                            className="text-danger/70 hover:text-danger text-xs px-2 py-1 rounded-md hover:bg-danger/10 cursor-pointer disabled:opacity-50"
                            title="Delete company"
                        >
                            {isDeleting ? '...' : '✕'}
                        </button>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                        background: STATUS_COLORS[company.status as CompanyStatus] + '18',
                        color: STATUS_COLORS[company.status as CompanyStatus],
                        border: `1px solid ${STATUS_COLORS[company.status as CompanyStatus]}33`,
                    }}
                >
                    {STATUS_LABELS[company.status as CompanyStatus]}
                </span>
                <span className="text-[11px] text-warning flex items-center gap-0.5">
                    ★ {getAverageRating(company)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${company.isPublic
                    ? 'bg-success/15 text-success border border-success/30'
                    : 'bg-surface-lighter/50 text-text-muted/60 border border-border/30'
                    }`}>
                    {company.isPublic ? 'Public' : 'Private'}
                </span>
                <span className="text-[11px] text-text-muted/50 ml-auto">
                    {new Date(company.createdAt).toLocaleDateString()}
                </span>
            </div>
            {company.notes && (
                <p className="text-[11px] text-text-muted/70 mt-2 line-clamp-2 leading-relaxed">
                    📝 {company.notes}
                </p>
            )}
        </div>
    )
}

export default function CompanyList({ companies, onDelete, onToggleVisibility, onSelect, isDeleting, currentUserId }: CompanyListProps) {
    const [showOthers, setShowOthers] = useState(false)

    if (companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-5xl mb-4 opacity-40">🏭</div>
                <p className="text-text-muted text-sm">No companies tracked yet.</p>
                <p className="text-text-muted/60 text-xs mt-1">Click the map and fill in the form to start!</p>
            </div>
        )
    }

    const myCompanies = companies.filter(c => c.userId === currentUserId)
    const othersCompanies = companies.filter(c => c.userId !== currentUserId)

    return (
        <div className="flex flex-col gap-6">
            {/* My Companies Section */}
            <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center justify-between border-b border-border/20 pb-2">
                    <span>My Personal Tracker</span>
                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {myCompanies.length}
                    </span>
                </h3>
                <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1">
                    {myCompanies.length > 0 ? (
                        myCompanies.map(c => (
                            <CompanyCard
                                key={c.id}
                                company={c}
                                isOwner={true}
                                onSelect={onSelect}
                                onToggleVisibility={onToggleVisibility}
                                onDelete={onDelete}
                                isDeleting={isDeleting === c.id}
                            />
                        ))
                    ) : (
                        <p className="text-xs text-text-muted/50 text-center py-4">You haven't added any data yet.</p>
                    )}
                </div>
            </div>

            {/* Others Companies Section */}
            {othersCompanies.length > 0 && (
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setShowOthers(!showOthers)}
                        className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center justify-between border-b border-border/20 pb-2 hover:text-primary transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-2">
                            <span>Others Public Tracks</span>
                            <span className={`text-[10px] transition-transform duration-200 ${showOthers ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </div>
                        <span className="bg-surface-lighter text-text-muted text-[10px] px-2 py-0.5 rounded-full font-bold group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                            {othersCompanies.length}
                        </span>
                    </button>

                    {showOthers && (
                        <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            {othersCompanies.map(c => (
                                <CompanyCard
                                    key={c.id}
                                    company={c}
                                    isOwner={false}
                                    onSelect={onSelect}
                                    onToggleVisibility={onToggleVisibility}
                                    onDelete={onDelete}
                                    isDeleting={isDeleting === c.id}
                                />
                            ))}
                        </div>
                    )}
                    {!showOthers && (
                        <p className="text-[10px] text-text-muted/40 text-center">Click to view public posts from other users.</p>
                    )}
                </div>
            )}
        </div>
    )
}

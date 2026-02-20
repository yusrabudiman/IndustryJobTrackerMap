import type { Company } from '../types/company'
import { CompanyStatus, STATUS_COLORS, STATUS_LABELS } from '../types/company'

interface CompanyListProps {
    companies: Company[]
    onDelete: (id: string) => void
    isDeleting: string | null
}

function getAverageRating(c: Company): string {
    return ((c.ratingSalary + c.ratingStability + c.ratingCulture) / 3).toFixed(1)
}

export default function CompanyList({ companies, onDelete, isDeleting }: CompanyListProps) {
    if (companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-5xl mb-4 opacity-40">🏭</div>
                <p className="text-text-muted text-sm">No companies tracked yet.</p>
                <p className="text-text-muted/60 text-xs mt-1">Click the map and fill in the form to start!</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Tracked Companies</span>
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
                    {companies.length}
                </span>
            </h3>
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {companies.map((company) => (
                    <div
                        key={company.id}
                        className="group p-3 rounded-xl bg-surface/70 border border-border/30 hover:border-border/60 transition-all duration-200 hover:bg-surface-lighter/30"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-text truncate">{company.name}</h4>
                                <p className="text-xs text-text-muted mt-0.5">{company.subSector}</p>
                            </div>
                            <button
                                onClick={() => onDelete(company.id)}
                                disabled={isDeleting === company.id}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  text-danger/70 hover:text-danger text-xs px-2 py-1 rounded-md hover:bg-danger/10 cursor-pointer
                  disabled:opacity-50"
                                title="Delete company"
                            >
                                {isDeleting === company.id ? '...' : '✕'}
                            </button>
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
                ))}
            </div>
        </div>
    )
}

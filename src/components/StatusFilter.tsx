import { CompanyStatus, STATUS_COLORS, STATUS_LABELS } from '../types/company'

interface StatusFilterProps {
    filteredStatuses: CompanyStatus[]
    onChange: (statuses: CompanyStatus[]) => void
}

export default function StatusFilter({ filteredStatuses, onChange }: StatusFilterProps) {
    function toggle(status: CompanyStatus) {
        if (filteredStatuses.includes(status)) {
            onChange(filteredStatuses.filter((s) => s !== status))
        } else {
            onChange([...filteredStatuses, status])
        }
    }

    const allActive = filteredStatuses.length === Object.keys(CompanyStatus).length

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Filter</h3>
                <button
                    onClick={() =>
                        onChange(allActive ? [] : Object.values(CompanyStatus))
                    }
                    className="text-[11px] text-primary hover:text-primary-light transition-colors cursor-pointer"
                >
                    {allActive ? 'Clear All' : 'Select All'}
                </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {Object.values(CompanyStatus).map((status) => {
                    const active = filteredStatuses.includes(status)
                    return (
                        <button
                            key={status}
                            onClick={() => toggle(status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${active
                                    ? 'shadow-sm'
                                    : 'opacity-40 hover:opacity-70 border-transparent'
                                }`}
                            style={active ? {
                                background: STATUS_COLORS[status] + '22',
                                color: STATUS_COLORS[status],
                                borderColor: STATUS_COLORS[status] + '55',
                            } : {
                                color: STATUS_COLORS[status],
                            }}
                        >
                            <span
                                className="inline-block w-2 h-2 rounded-full mr-1.5"
                                style={{ background: STATUS_COLORS[status] }}
                            />
                            {STATUS_LABELS[status]}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

import { useState, useMemo, useEffect, useRef } from 'react'
import type { Company } from '../types/company'

interface LocationSearchProps {
    companies: Company[]
    onSelect: (company: Company) => void
}

export default function LocationSearch({ companies, onSelect }: LocationSearchProps) {
    const [query, setQuery] = useState('')
    const [showResults, setShowResults] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const filteredCompanies = useMemo(() => {
        if (!query.trim()) return []
        const q = query.toLowerCase()
        return companies.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.subSector.toLowerCase().includes(q) ||
            (c.notes && c.notes.toLowerCase().includes(q))
        ).slice(0, 8)
    }, [query, companies])

    // Close results when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search companies, sub-sectors..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-lighter/30 border border-border/30 focus:border-primary/50 focus:bg-surface-lighter/50 outline-none text-sm transition-all text-text placeholder:text-text-muted/50"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setShowResults(true)
                    }}
                    onFocus={() => setShowResults(true)}
                />
            </div>

            {showResults && query.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[1001] rounded-xl glass border border-border/50 shadow-2xl overflow-hidden">
                    {filteredCompanies.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto">
                            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted/70 font-bold border-b border-border/10 bg-surface-light/30">
                                Matching Trackers
                            </div>
                            {filteredCompanies.map((company) => (
                                <button
                                    key={company.id}
                                    onClick={() => {
                                        onSelect(company)
                                        setQuery('')
                                        setShowResults(false)
                                    }}
                                    className="w-full text-left p-3 hover:bg-primary/10 flex flex-col gap-0.5 transition-colors border-b border-border/10 last:border-0 cursor-pointer group/item"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-text group-hover/item:text-primary transition-colors">{company.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-lighter/50 text-text-muted font-medium">
                                            {company.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase tracking-wider text-primary-light font-bold">
                                            {company.subSector}
                                        </span>
                                        {company.notes && (
                                            <span className="text-[10px] text-text-muted truncate italic">• {company.notes.substring(0, 40)}...</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <div className="text-2xl mb-2 opacity-50">🔍</div>
                            <p className="text-sm text-text-muted italic">No matching companies found</p>
                            <p className="text-[10px] text-text-muted/60 mt-1">Try searching by name or food sub-sector</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

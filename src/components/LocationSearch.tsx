import { useState, useEffect, useRef } from 'react'
import type { Company } from '../types/company'

interface LocationSearchProps {
    companies: Company[]
    onSelect: (company: Company) => void
}

export default function LocationSearch({ companies, onSelect }: LocationSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Company[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const filtered = companies.filter(c =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.subSector.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)

        setResults(filtered)
    }, [query, companies])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none opacity-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search company or sector..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-surface border border-border/40 rounded-xl py-2 pl-10 pr-4 text-sm 
                        focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 
                        transition-all duration-200 placeholder:text-text-muted/40"
                />

                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-3 flex items-center opacity-40 hover:opacity-100 transition-opacity"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 glass rounded-xl border border-border/40 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto">
                        {results.map((company) => (
                            <button
                                key={company.id}
                                onClick={() => {
                                    onSelect(company)
                                    setQuery('')
                                    setIsOpen(false)
                                }}
                                className="w-full text-left p-3 hover:bg-primary/15 transition-colors duration-150 group border-b border-border/10 last:border-none"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-sm text-text truncate group-hover:text-primary transition-colors">
                                            {company.name}
                                        </div>
                                        <div className="text-[11px] text-text-muted">
                                            {company.subSector}
                                        </div>
                                    </div>
                                    <div className="text-xs opacity-40 group-hover:opacity-100 transition-opacity">
                                        📍
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && query && results.length === 0 && (
                <div className="absolute z-50 w-full mt-2 glass rounded-xl border border-border/40 p-4 text-center animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-text-muted">No matches found for "{query}"</p>
                </div>
            )}
        </div>
    )
}

import { useState, type FormEvent } from 'react'
import type { CompanyInput } from '../types/company'
import { CompanyStatus, SUB_SECTORS, STATUS_LABELS } from '../types/company'

interface CompanyFormProps {
    selectedCoords: { lat: number; lng: number } | null
    onSubmit: (data: CompanyInput) => Promise<void>
    isSubmitting: boolean
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">{label}</label>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`text-2xl transition-all duration-200 hover:scale-125 cursor-pointer ${star <= value ? 'star-active' : 'star-inactive'
                            }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function CompanyForm({ selectedCoords, onSubmit, isSubmitting }: CompanyFormProps) {
    const [name, setName] = useState('')
    const [subSector, setSubSector] = useState<string>(SUB_SECTORS[0])
    const [status, setStatus] = useState<CompanyStatus>(CompanyStatus.APPLIED)
    const [ratingSalary, setRatingSalary] = useState(3)
    const [ratingStability, setRatingStability] = useState(3)
    const [ratingCulture, setRatingCulture] = useState(3)
    const [notes, setNotes] = useState('')

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!selectedCoords) return

        await onSubmit({
            name,
            subSector,
            latitude: selectedCoords.lat,
            longitude: selectedCoords.lng,
            status,
            ratingSalary,
            ratingStability,
            ratingCulture,
            notes: notes || null,
        })

        // Reset form
        setName('')
        setSubSector(SUB_SECTORS[0])
        setStatus(CompanyStatus.APPLIED)
        setRatingSalary(3)
        setRatingStability(3)
        setRatingCulture(3)
        setNotes('')
    }

    const inputClasses = 'w-full bg-surface rounded-lg border border-border/50 px-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200'
    const selectClasses = `${inputClasses} appearance-none cursor-pointer`

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    +
                </span>
                Add Company
            </h3>

            {/* Company Name */}
            <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Company Name *</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. PT Mie Enak Sejahtera"
                    required
                    className={inputClasses}
                />
            </div>

            {/* Sub-Sector */}
            <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Sub-Sector *</label>
                <select
                    value={subSector}
                    onChange={(e) => setSubSector(e.target.value)}
                    className={selectClasses}
                >
                    {SUB_SECTORS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Latitude</label>
                    <input
                        type="text"
                        value={selectedCoords ? selectedCoords.lat.toFixed(6) : '—'}
                        readOnly
                        className={`${inputClasses} bg-surface-lighter/50 cursor-not-allowed text-text-muted`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Longitude</label>
                    <input
                        type="text"
                        value={selectedCoords ? selectedCoords.lng.toFixed(6) : '—'}
                        readOnly
                        className={`${inputClasses} bg-surface-lighter/50 cursor-not-allowed text-text-muted`}
                    />
                </div>
            </div>
            {!selectedCoords && (
                <p className="text-xs text-warning/80 -mt-2 flex items-center gap-1">
                    <span>📍</span> Click on the map to set coordinates
                </p>
            )}

            {/* Status */}
            <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Application Status *</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CompanyStatus)}
                    className={selectClasses}
                >
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Ratings */}
            <div className="space-y-3 p-3 rounded-lg bg-surface/60 border border-border/30">
                <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">Ratings</p>
                <StarRating value={ratingSalary} onChange={setRatingSalary} label="💰 Salary" />
                <StarRating value={ratingStability} onChange={setRatingStability} label="🏢 Stability" />
                <StarRating value={ratingCulture} onChange={setRatingCulture} label="🤝 Culture" />
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Notes / Red Flags</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. HR friendly, lokasi jauh, jam lembur sering..."
                    rows={3}
                    className={`${inputClasses} resize-none`}
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={!selectedCoords || !name || isSubmitting}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer
          bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary
          text-white shadow-lg shadow-primary/25 hover:shadow-primary/40
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.98]"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                    </span>
                ) : '📌 Save Company'}
            </button>
        </form>
    )
}

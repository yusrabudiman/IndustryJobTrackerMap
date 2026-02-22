import { useState, useEffect, type FormEvent } from 'react'
import { Star, Edit3, Plus, MapPin, Banknote, Building2, Users2, Globe, Lock, Loader2 } from 'lucide-react'
import type { CompanyInput, Company } from '../types/company'
import { CompanyStatus, SUB_SECTORS, STATUS_LABELS } from '../types/company'

interface CompanyFormProps {
    selectedCoords: { lat: number; lng: number } | null
    editingCompany?: Company | null
    onCancelEdit?: () => void
    onSubmit: (data: CompanyInput) => Promise<void>
    isSubmitting: boolean
}

function StarRating({ value, onChange, label, icon: Icon }: { value: number; onChange: (v: number) => void; label: string; icon: any }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-text-muted" />
                <label className="block text-sm font-medium text-text-muted">{label}</label>
            </div>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`transition-all duration-200 hover:scale-125 cursor-pointer ${star <= value ? 'text-warning fill-warning' : 'text-text-muted/20'}`}
                    >
                        <Star className={`w-6 h-6 ${star <= value ? 'fill-warning' : ''}`} />
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function CompanyForm({ selectedCoords, editingCompany, onCancelEdit, onSubmit, isSubmitting }: CompanyFormProps) {
    const [name, setName] = useState('')
    const [subSector, setSubSector] = useState<string>(SUB_SECTORS[0])
    const [customSubSector, setCustomSubSector] = useState('')
    const [status, setStatus] = useState<CompanyStatus>(CompanyStatus.APPLIED)
    const [ratingSalary, setRatingSalary] = useState(3)
    const [ratingStability, setRatingStability] = useState(3)
    const [ratingCulture, setRatingCulture] = useState(3)
    const [notes, setNotes] = useState('')
    const [isPublic, setIsPublic] = useState(false)

    // Sync form with editingCompany
    useEffect(() => {
        if (editingCompany) {
            setName(editingCompany.name)
            const isStandard = (SUB_SECTORS as readonly string[]).includes(editingCompany.subSector)
            setSubSector((isStandard ? editingCompany.subSector : 'Other...') as any)
            setCustomSubSector(isStandard ? '' : editingCompany.subSector)
            setStatus(editingCompany.status as CompanyStatus)
            setRatingSalary(editingCompany.ratingSalary)
            setRatingStability(editingCompany.ratingStability)
            setRatingCulture(editingCompany.ratingCulture)
            setNotes(editingCompany.notes || '')
            setIsPublic(editingCompany.isPublic)
        }
    }, [editingCompany])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()

        // In edit mode, use the company's existing coordinates if the user
        // hasn't clicked the map to set new ones
        const coordsToUse = selectedCoords ?? (
            editingCompany
                ? { lat: editingCompany.latitude, lng: editingCompany.longitude }
                : null
        )

        if (!coordsToUse) return  // Only block if truly no coords at all

        await onSubmit({
            name,
            subSector: (subSector === 'Other...' ? customSubSector : subSector) as any,
            latitude: coordsToUse.lat,
            longitude: coordsToUse.lng,
            status,
            ratingSalary,
            ratingStability,
            ratingCulture,
            notes: notes || null,
            isPublic,
        })

        // Reset form
        setName('')
        setSubSector(SUB_SECTORS[0])
        setCustomSubSector('')
        setStatus(CompanyStatus.APPLIED)
        setRatingSalary(3)
        setRatingStability(3)
        setRatingCulture(3)
        setNotes('')
        setIsPublic(false)
    }

    const inputClasses = 'w-full bg-surface rounded-lg border border-border/40 px-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200'
    const selectClasses = `${inputClasses} appearance-none cursor-pointer`

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        {editingCompany ? <Edit3 className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                    </span>
                    {editingCompany ? 'Edit Company' : 'Add Company'}
                </h3>
                {editingCompany && onCancelEdit && (
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="text-xs text-text-muted hover:text-text underline cursor-pointer"
                    >
                        Cancel Edit
                    </button>
                )}
            </div>

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
                <div className="flex flex-col gap-2">
                    <select
                        value={subSector}
                        onChange={(e) => {
                            setSubSector(e.target.value)
                            if (e.target.value !== 'Other...') {
                                setCustomSubSector('')
                            }
                        }}
                        className={selectClasses}
                    >
                        {SUB_SECTORS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="Other...">Other...</option>
                    </select>

                    {subSector === 'Other...' && (
                        <input
                            type="text"
                            value={customSubSector}
                            onChange={(e) => setCustomSubSector(e.target.value)}
                            placeholder="Type custom sub-sector..."
                            required
                            className={inputClasses}
                            autoFocus
                        />
                    )}
                </div>
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
                    <MapPin className="w-3 h-3" /> Click on the map to set coordinates
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
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Ratings</p>
                <StarRating value={ratingSalary} onChange={setRatingSalary} label="Salary" icon={Banknote} />
                <StarRating value={ratingStability} onChange={setRatingStability} label="Stability" icon={Building2} />
                <StarRating value={ratingCulture} onChange={setRatingCulture} label="Culture" icon={Users2} />
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

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface/60 border border-border/30">
                <div>
                    <p className="text-sm font-medium text-text">Visibility</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {isPublic ? (
                            <>
                                <Globe className="w-3 h-3 text-text-muted" />
                                <span className="text-xs text-text-muted">Visible to everyone</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-3 h-3 text-text-muted" />
                                <span className="text-xs text-text-muted">Only visible to you</span>
                            </>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${isPublic
                        ? 'bg-gradient-to-r from-primary to-primary-light'
                        : 'bg-surface-lighter'
                        }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${isPublic ? 'translate-x-6' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={(!selectedCoords && !editingCompany) || !name || isSubmitting || (subSector === 'Other...' && !customSubSector.trim())}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer
          bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary
          text-white shadow-lg shadow-primary/25 hover:shadow-primary/40
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.98]"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                    </span>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Save Company</span>
                    </div>
                )}
            </button>
        </form>
    )
}

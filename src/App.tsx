import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import CompanyForm from './components/CompanyForm'
import CompanyList from './components/CompanyList'
import StatusFilter from './components/StatusFilter'
import { getCompanies, createCompany, deleteCompany } from './lib/api'
import type { Company, CompanyInput } from './types/company'
import { CompanyStatus } from './types/company'

export default function App() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [filteredStatuses, setFilteredStatuses] = useState<CompanyStatus[]>(Object.values(CompanyStatus))
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const loadCompanies = useCallback(async () => {
        try {
            const data = await getCompanies()
            setCompanies(data)
        } catch (err) {
            console.error('Failed to load companies:', err)
            setError('Failed to load companies. Check your connection.')
        }
    }, [])

    useEffect(() => {
        loadCompanies()
    }, [loadCompanies])

    async function handleSubmit(data: CompanyInput) {
        setIsSubmitting(true)
        setError(null)
        try {
            await createCompany(data)
            await loadCompanies()
            setSelectedCoords(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create company')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        setIsDeleting(id)
        setError(null)
        try {
            await deleteCompany(id)
            await loadCompanies()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete company')
        } finally {
            setIsDeleting(null)
        }
    }

    function handleMapClick(lat: number, lng: number) {
        setSelectedCoords({ lat, lng })
        if (!sidebarOpen) setSidebarOpen(true)
    }

    return (
        <div className="relative w-full h-full">
            {/* Full-screen Map */}
            <MapView
                companies={companies}
                filteredStatuses={filteredStatuses}
                onMapClick={handleMapClick}
                selectedCoords={selectedCoords}
            />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}>
                {/* Error toast */}
                {error && (
                    <div className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs flex items-start gap-2">
                        <span className="mt-0.5">⚠️</span>
                        <div>
                            <p>{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-danger/70 hover:text-danger underline mt-1 cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Status Filter */}
                <StatusFilter
                    filteredStatuses={filteredStatuses}
                    onChange={setFilteredStatuses}
                />

                {/* Divider */}
                <hr className="border-border/30" />

                {/* Add Company Form */}
                <CompanyForm
                    selectedCoords={selectedCoords}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />

                {/* Divider */}
                <hr className="border-border/30" />

                {/* Company List */}
                <CompanyList
                    companies={companies}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                />
            </Sidebar>
        </div>
    )
}

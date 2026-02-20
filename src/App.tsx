import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import CompanyForm from './components/CompanyForm'
import CompanyList from './components/CompanyList'
import StatusFilter from './components/StatusFilter'
import AuthPage from './components/AuthPage'
import LandingPage from './components/LandingPage'
import LocationSearch from './components/LocationSearch'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { getCompanies, createCompany, deleteCompany, toggleCompanyVisibility } from './lib/api'
import type { Company, CompanyInput } from './types/company'
import { CompanyStatus } from './types/company'

function Dashboard() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [companies, setCompanies] = useState<Company[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [focusCompany, setFocusCompany] = useState<Company | null>(null)
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

    async function handleToggleVisibility(id: string, isPublic: boolean) {
        try {
            await toggleCompanyVisibility(id, isPublic)
            await loadCompanies()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update visibility')
        }
    }

    function handleMapClick(lat: number, lng: number) {
        setSelectedCoords({ lat, lng })
        setFocusCompany(null)
        if (!sidebarOpen) setSidebarOpen(true)
    }

    function handleSelectCompany(company: Company) {
        setFocusCompany(company)
        setSelectedCoords(null)
    }

    return (
        <div className="relative w-full h-full">
            <MapView
                companies={companies}
                filteredStatuses={filteredStatuses}
                onMapClick={handleMapClick}
                selectedCoords={selectedCoords}
                focusCompany={focusCompany}
            />

            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}>
                <div className="user-bar">
                    <div className="user-bar-info">
                        <div className="user-avatar text-white">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-surface-lighter transition-colors cursor-pointer"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </button>
                        <button onClick={logout} className="logout-btn" title="Sign Out">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <LocationSearch
                    companies={companies}
                    onSelect={handleSelectCompany}
                />

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

                <StatusFilter
                    filteredStatuses={filteredStatuses}
                    onChange={setFilteredStatuses}
                />

                <hr className="border-border/30" />

                <CompanyForm
                    selectedCoords={selectedCoords}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />

                <hr className="border-border/30" />

                <CompanyList
                    companies={companies}
                    onDelete={handleDelete}
                    onToggleVisibility={handleToggleVisibility}
                    onSelect={handleSelectCompany}
                    isDeleting={isDeleting}
                    currentUserId={user?.id || null}
                />
            </Sidebar>
        </div>
    )
}

type AppPage = 'landing' | 'auth' | 'dashboard'

function AppContent() {
    const { user, isLoading } = useAuth()
    const [page, setPage] = useState<AppPage>('landing')

    useEffect(() => {
        if (user) setPage('dashboard')
    }, [user])

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p className="loading-text">Loading...</p>
            </div>
        )
    }

    if (user) {
        return <Dashboard />
    }

    if (page === 'auth') {
        return <AuthPage onBackToLanding={() => setPage('landing')} />
    }

    return <LandingPage onGetStarted={() => setPage('auth')} />
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    )
}

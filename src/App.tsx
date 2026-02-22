import { useState, useEffect, useCallback } from 'react'
import { Crown, Moon, Sun, LogOut, AlertTriangle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import CompanyForm from './components/CompanyForm'
import CompanyList from './components/CompanyList'
import StatusFilter from './components/StatusFilter'
import AuthPage from './components/AuthPage'
import LandingPage from './components/LandingPage'
import LocationSearch from './components/LocationSearch.tsx'
import AdminPage from './components/AdminPage'
import DiscussionModal from './components/DiscussionModal'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { getCompanies, createCompany, deleteCompany, updateCompany } from './lib/api'
import type { Company, CompanyInput } from './types/company'
import { CompanyStatus } from './types/company'

function Dashboard() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [showAdmin, setShowAdmin] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [focusCompany, setFocusCompany] = useState<Company | null>(null)
    const [filteredStatuses, setFilteredStatuses] = useState<CompanyStatus[]>(Object.values(CompanyStatus))
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [discussionCompany, setDiscussionCompany] = useState<Company | null>(null)

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
            if (editingCompany) {
                await handleUpdateCompany(editingCompany.id, data)
                setEditingCompany(null)
                // Optionally show a success toast here
            } else {
                const originalCompanies = [...companies]
                try {
                    await createCompany(data)
                    await loadCompanies()
                } catch (err) {
                    setCompanies(originalCompanies)
                    setError(err instanceof Error ? err.message : 'Failed to save company')
                    return // Stop if create failed
                }
            }
            setSelectedCoords(null)
        } catch (err) {
            // Error already handled in handleUpdateCompany, just catch to avoid unhandled rejection
            console.error('Submit error:', err)
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
        handleUpdateCompany(id, { isPublic })
    }

    async function handleUpdateCompany(id: string, data: Partial<CompanyInput>) {
        const originalCompanies = [...companies]

        try {
            // Send update to server and get the confirmed record back
            const updated = await updateCompany(id, data)

            // Immediately sync state with the confirmed record from DB
            setCompanies(prev => prev.map(c => c.id === id ? updated : c))
            if (focusCompany?.id === id) {
                setFocusCompany(updated)
            }
            return updated
        } catch (err) {
            setCompanies(originalCompanies) // Rollback only on actual failure
            const message = err instanceof Error ? err.message : 'Failed to update company'
            setError(message)
            throw new Error(message) // Re-throw so the caller knows it failed
        }
    }

    function startEditing(company: Company) {
        setEditingCompany(company)
        setSelectedCoords({ lat: company.latitude, lng: company.longitude })
        setFocusCompany(company)
        // Scroll to top of sidebar
        document.querySelector('aside')?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleMapClick(lat: number, lng: number) {
        setSelectedCoords({ lat, lng })
        setFocusCompany(null)
        // Removed: setEditingCompany(null) - Keep the editing state if we are editing
        if (!sidebarOpen) setSidebarOpen(true)
    }

    function handleSelectCompany(company: Company) {
        setFocusCompany(company)
        setSelectedCoords(null)
        setEditingCompany(null)
    }

    // Show Admin Page if active
    if (showAdmin) {
        return <AdminPage onBack={() => setShowAdmin(false)} />
    }

    return (
        <div className="relative w-full h-full">
            <MapView
                companies={companies}
                filteredStatuses={filteredStatuses}
                onMapClick={handleMapClick}
                selectedCoords={selectedCoords}
                focusCompany={focusCompany}
                currentUserId={user?.id || null}
                onEdit={startEditing}
                onOpenDiscussion={setDiscussionCompany}
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
                        {user?.role === 'ADMIN' && (
                            <button
                                onClick={() => setShowAdmin(true)}
                                className="p-2 rounded-lg hover:bg-surface-lighter transition-colors cursor-pointer text-amber-400"
                                title="Admin Panel"
                            >
                                <Crown className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-surface-lighter transition-colors cursor-pointer"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? (
                                <Moon className="w-5 h-5 text-text" />
                            ) : (
                                <Sun className="w-5 h-5 text-text" />
                            )}
                        </button>
                        <button onClick={logout} className="logout-btn" title="Sign Out">
                            <LogOut className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                <LocationSearch
                    companies={companies}
                    onSelect={handleSelectCompany}
                />

                {error && (
                    <div className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
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
                    editingCompany={editingCompany}
                    onCancelEdit={() => setEditingCompany(null)}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />

                <hr className="border-border/30" />

                <CompanyList
                    companies={companies}
                    onDelete={handleDelete}
                    onToggleVisibility={handleToggleVisibility}
                    onUpdate={startEditing}
                    onSelect={handleSelectCompany}
                    isDeleting={isDeleting}
                    currentUserId={user?.id || null}
                    onOpenDiscussion={setDiscussionCompany}
                />
            </Sidebar>

            {discussionCompany && (
                <DiscussionModal
                    company={discussionCompany}
                    onClose={() => setDiscussionCompany(null)}
                />
            )}
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

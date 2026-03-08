import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/company'
import { getMe, logoutUser } from '../lib/api'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (user: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const logout = useCallback(async () => {
        try {
            // Tell the server to clear the HttpOnly cookie
            await logoutUser()
        } catch {
            // Even if the server call fails, clear local state
        } finally {
            setUser(null)
        }
    }, [])

    useEffect(() => {
        // On mount: verify session by calling /api/auth/me
        // The HttpOnly cookie is sent automatically — no localStorage token needed
        getMe()
            .then((u) => setUser(u))
            .catch(() => {
                // No valid session — stay logged out (cookie expired or not set)
                setUser(null)
            })
            .finally(() => setIsLoading(false))
    }, [])

    const login = useCallback((newUser: User) => {
        // The token is already in the HttpOnly cookie (set by server on login/register)
        // We only need to store the user profile in React state
        setUser(newUser)
    }, [])

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

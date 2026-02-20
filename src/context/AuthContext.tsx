import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/company'
import { getMe } from '../lib/api'

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (token: string, user: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
    const [isLoading, setIsLoading] = useState(true)

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
    }, [])

    useEffect(() => {
        if (!token) {
            setIsLoading(false)
            return
        }

        getMe()
            .then((u) => setUser(u))
            .catch(() => {
                logout()
            })
            .finally(() => setIsLoading(false))
    }, [token, logout])

    const login = useCallback((newToken: string, newUser: User) => {
        localStorage.setItem('auth_token', newToken)
        setToken(newToken)
        setUser(newUser)
    }, [])

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

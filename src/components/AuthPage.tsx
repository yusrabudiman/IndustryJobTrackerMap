import { useState } from 'react'
import { loginUser, registerUser } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface AuthPageProps {
    onBackToLanding?: () => void
}

export default function AuthPage({ onBackToLanding }: AuthPageProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            if (!isLogin && password !== confirmPassword) {
                throw new Error('Passwords do not match')
            }

            const result = isLogin
                ? await loginUser(email, password)
                : await registerUser(name, email, password)

            login(result.token, result.user)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    function switchMode() {
        setIsLogin(!isLogin)
        setError(null)
        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
    }

    return (
        <div className="auth-page">
            {/* Animated background */}
            <div className="auth-bg">
                <div className="auth-bg-orb auth-bg-orb-1" />
                <div className="auth-bg-orb auth-bg-orb-2" />
                <div className="auth-bg-orb auth-bg-orb-3" />
            </div>

            {/* Back to landing button */}
            {onBackToLanding && (
                <button onClick={onBackToLanding} className="auth-back-btn" title="Back to home">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>Home</span>
                </button>
            )}

            <div className="auth-container">
                {/* Logo / Brand */}
                <div className="auth-brand">
                    <div className="auth-logo">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="12" fill="url(#logo-grad)" />
                            <path d="M12 20L17 25L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                                    <stop stopColor="#6366f1" />
                                    <stop offset="1" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h1 className="auth-title">Job Tracker</h1>
                    <p className="auth-subtitle">
                        {isLogin
                            ? 'Welcome back! Sign in to continue tracking.'
                            : 'Create an account to start your journey.'}
                    </p>
                </div>

                {/* Card */}
                <div className="auth-card">
                    {/* Tabs */}
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${isLogin ? 'auth-tab-active' : ''}`}
                            onClick={() => switchMode()}
                            type="button"
                        >
                            Sign In
                        </button>
                        <button
                            className={`auth-tab ${!isLogin ? 'auth-tab-active' : ''}`}
                            onClick={() => switchMode()}
                            type="button"
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Error message */}
                        {error && (
                            <div className="auth-error">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Name field (sign up only) */}
                        {!isLogin && (
                            <div className="auth-field">
                                <label htmlFor="auth-name" className="auth-label">Full Name</label>
                                <div className="auth-input-wrapper">
                                    <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input
                                        id="auth-name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="auth-input"
                                        autoComplete="name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email field */}
                        <div className="auth-field">
                            <label htmlFor="auth-email" className="auth-label">Email</label>
                            <div className="auth-input-wrapper">
                                <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                <input
                                    id="auth-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="auth-input"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="auth-field">
                            <label htmlFor="auth-password" className="auth-label">Password</label>
                            <div className="auth-input-wrapper">
                                <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="auth-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="auth-input"
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password (sign up only) */}
                        {!isLogin && (
                            <div className="auth-field">
                                <label htmlFor="auth-confirm-password" className="auth-label">Confirm Password</label>
                                <div className="auth-input-wrapper">
                                    <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        id="auth-confirm-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="auth-input"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="auth-spinner" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            {' '}
                            <button type="button" onClick={switchMode} className="auth-link">
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Info badge */}
                <div className="auth-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <span>Track your food industry job applications on an interactive map</span>
                </div>
            </div>
        </div>
    )
}

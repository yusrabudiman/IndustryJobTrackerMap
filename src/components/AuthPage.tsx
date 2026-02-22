import { useState } from 'react'
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Info
} from 'lucide-react'
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
                    <ArrowLeft className="w-5 h-5" />
                    <span>Home</span>
                </button>
            )}

            <div className="auth-container">
                {/* Logo / Brand */}
                <div className="auth-brand">
                    <div className="auth-logo">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
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
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Name field (sign up only) */}
                        {!isLogin && (
                            <div className="auth-field">
                                <label htmlFor="auth-name" className="auth-label">Full Name</label>
                                <div className="auth-input-wrapper">
                                    <User className="auth-input-icon w-[18px] h-[18px]" />
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
                                <Mail className="auth-input-icon w-[18px] h-[18px]" />
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
                                <Lock className="auth-input-icon w-[18px] h-[18px]" />
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
                                        <EyeOff className="w-[18px] h-[18px]" />
                                    ) : (
                                        <Eye className="w-[18px] h-[18px]" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password (sign up only) */}
                        {!isLogin && (
                            <div className="auth-field">
                                <label htmlFor="auth-confirm-password" className="auth-label">Confirm Password</label>
                                <div className="auth-input-wrapper">
                                    <Lock className="auth-input-icon w-[18px] h-[18px]" />
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
                                    <ArrowRight className="w-[18px] h-[18px]" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            {' '}
                            <button type="button" onClick={switchMode} className="auth-link font-bold">
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Info badge */}
                <div className="auth-info">
                    <Info className="w-3.5 h-3.5" />
                    <span>Track your food industry job applications on an interactive map</span>
                </div>
            </div>
        </div>
    )
}

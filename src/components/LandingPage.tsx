import { useState, useEffect } from 'react'
import {
    MapPin,
    LayoutDashboard,
    ShieldCheck,
    Users,
    Activity,
    Cloud,
    ArrowRight,
    PlayCircle,
    Lock,
    BarChart3,
    CheckCircle2
} from 'lucide-react'

interface LandingPageProps {
    onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
    const [scrollY, setScrollY] = useState(0)
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['hero']))

    useEffect(() => {
        const container = document.getElementById('landing-scroll')
        if (!container) return

        const handleScroll = () => {
            setScrollY(container.scrollTop)

            const sections = ['hero', 'features', 'how-it-works', 'stats', 'stats', 'cta']
            const newVisible = new Set<string>()
            sections.forEach((id) => {
                const el = document.getElementById(id)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.top < window.innerHeight * 0.8) {
                        newVisible.add(id)
                    }
                }
            })
            setVisibleSections(newVisible)
        }

        container.addEventListener('scroll', handleScroll)
        handleScroll()
        return () => container.removeEventListener('scroll', handleScroll)
    }, [])

    const sectionClass = (id: string) =>
        `landing-section ${visibleSections.has(id) ? 'landing-section-visible' : ''}`

    return (
        <div className="landing-page" id="landing-scroll">
            {/* Animated Background */}
            {/* ... (background code remains the same) */}
            <div className="landing-bg">
                <div className="landing-bg-grid" />
                <div
                    className="landing-bg-orb landing-bg-orb-hero-1"
                    style={{ transform: `translate(${scrollY * 0.05}px, ${scrollY * -0.03}px)` }}
                />
                <div
                    className="landing-bg-orb landing-bg-orb-hero-2"
                    style={{ transform: `translate(${scrollY * -0.04}px, ${scrollY * 0.02}px)` }}
                />
                <div
                    className="landing-bg-orb landing-bg-orb-hero-3"
                    style={{ transform: `translate(${scrollY * 0.03}px, ${scrollY * 0.04}px)` }}
                />
            </div>

            {/* Navigation */}
            <nav className={`landing-nav ${scrollY > 50 ? 'landing-nav-scrolled' : ''}`}>
                <div className="landing-nav-inner">
                    <div className="landing-nav-brand">
                        <div className="landing-nav-logo">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <span className="landing-nav-title">JobTracker</span>
                    </div>
                    <div className="landing-nav-actions">
                        <button onClick={onGetStarted} className="landing-nav-signin">Sign In</button>
                        <button onClick={onGetStarted} className="landing-nav-cta-btn">Get Started</button>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ─── */}
            <section id="hero" className={sectionClass('hero')}>
                <div className="landing-hero">
                    <div className="landing-hero-badge">
                        <span className="landing-hero-badge-dot" />
                        <span>Food Industry Career Tracker</span>
                    </div>

                    <h1 className="landing-hero-title">
                        Map Your Career<br />
                        <span className="landing-hero-gradient">In Food Industry</span>
                    </h1>

                    <p className="landing-hero-desc">
                        Track job applications, visualize interview results on an interactive map,
                        and manage your food industry career journey — all in one powerful dashboard.
                    </p>

                    <div className="landing-hero-btns">
                        <button onClick={onGetStarted} className="landing-hero-primary-btn">
                            <span>Start Tracking Free</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <a href="#features" className="landing-hero-secondary-btn">
                            <PlayCircle className="w-4 h-4" />
                            <span>See How It Works</span>
                        </a>
                    </div>

                    {/* Hero Map Preview */}
                    {/* ... (preview code remains the same) */}
                    <div className="landing-hero-preview">
                        <div className="landing-hero-preview-glow" />
                        <div className="landing-hero-preview-card">
                            <div className="landing-preview-topbar">
                                <div className="landing-preview-dots">
                                    <span /><span /><span />
                                </div>
                                <span className="landing-preview-url">jobtracker.app/dashboard</span>
                            </div>
                            <div className="landing-preview-content">
                                {/* Sidebar mock */}
                                <div className="landing-preview-sidebar">
                                    <div className="landing-preview-sb-header">
                                        <div className="landing-preview-sb-avatar" />
                                        <div className="landing-preview-sb-lines">
                                            <div className="landing-preview-line w-20" />
                                            <div className="landing-preview-line w-14 opacity-50" />
                                        </div>
                                    </div>
                                    <div className="landing-preview-sb-items">
                                        {[
                                            { color: '#22c55e', label: 'PT Mie Enak', sub: 'FMCG' },
                                            { color: '#eab308', label: 'Sari Roti Corp', sub: 'Manufacturing' },
                                            { color: '#9ca3af', label: 'GrabFood HQ', sub: 'Food Tech' },
                                            { color: '#ef4444', label: 'KFC Indonesia', sub: 'Restaurant' },
                                        ].map((item, i) => (
                                            <div key={i} className="landing-preview-sb-item">
                                                <div className="landing-preview-sb-dot" style={{ background: item.color }} />
                                                <div>
                                                    <div className="landing-preview-line w-16" style={{ marginBottom: 3 }}>{item.label}</div>
                                                    <div className="landing-preview-line w-10 opacity-40" style={{ fontSize: 7 }}>{item.sub}</div>
                                                </div>
                                                <div className="landing-preview-stars">★★★★</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Map mock */}
                                <div className="landing-preview-map">
                                    <div className="landing-preview-map-grid" />
                                    {/* Map markers */}
                                    {[
                                        { top: '25%', left: '30%', color: '#22c55e', size: 12, pulse: true },
                                        { top: '45%', left: '55%', color: '#eab308', size: 10, pulse: false },
                                        { top: '60%', left: '35%', color: '#9ca3af', size: 10, pulse: false },
                                        { top: '35%', left: '70%', color: '#ef4444', size: 10, pulse: false },
                                        { top: '70%', left: '60%', color: '#22c55e', size: 8, pulse: true },
                                        { top: '20%', left: '65%', color: '#6366f1', size: 9, pulse: false },
                                    ].map((m, i) => (
                                        <div
                                            key={i}
                                            className={`landing-preview-marker ${m.pulse ? 'landing-preview-marker-pulse' : ''}`}
                                            style={{
                                                top: m.top,
                                                left: m.left,
                                                width: m.size,
                                                height: m.size,
                                                background: m.color,
                                                animationDelay: `${i * 0.3}s`,
                                            }}
                                        />
                                    ))}
                                    {/* Popup mock */}
                                    <div className="landing-preview-popup">
                                        <div className="landing-preview-popup-title">PT Mie Enak Sejahtera</div>
                                        <div className="landing-preview-popup-sub">FMCG · ★★★★☆</div>
                                        <div className="landing-preview-popup-badge">Joined</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ─── */}
            <section id="features" className={sectionClass('features')}>
                <div className="landing-features">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Features</span>
                        <h2 className="landing-section-title">Everything You Need to<br /><span className="landing-hero-gradient">Track Your Career</span></h2>
                        <p className="landing-section-desc">Powerful tools designed specifically for food industry professionals</p>
                    </div>

                    <div className="landing-features-grid">
                        {[
                            {
                                icon: <MapPin className="w-6 h-6" />,
                                title: 'Interactive Map',
                                desc: 'Visualize every application on an immersive map. Click to add, hover to explore, filter by status.',
                                color: '#6366f1',
                            },
                            {
                                icon: <LayoutDashboard className="w-6 h-6" />,
                                title: 'Smart Dashboard',
                                desc: 'Track ratings on salary, stability, and culture. Get instant insights on your best opportunities.',
                                color: '#8b5cf6',
                            },
                            {
                                icon: <ShieldCheck className="w-6 h-6" />,
                                title: 'Public & Private',
                                desc: 'Control who sees your data. Keep your journey private or share publicly to help others.',
                                color: '#22c55e',
                            },
                            {
                                icon: <Users className="w-6 h-6" />,
                                title: 'Multi-User',
                                desc: 'Personal accounts with secure authentication. See public entries from other food industry seekers.',
                                color: '#eab308',
                            },
                            {
                                icon: <Activity className="w-6 h-6" />,
                                title: 'Status Tracking',
                                desc: 'From Applied → Interview → Offered → Joined. See your entire pipeline at a glance with color-coded markers.',
                                color: '#f43f5e',
                            },
                            {
                                icon: <Cloud className="w-6 h-6" />,
                                title: 'Cloud Powered',
                                desc: 'Built on Prisma & PostgreSQL for blazing-fast performance. Your data syncs across all your devices.',
                                color: '#06b6d4',
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="landing-feature-card"
                                style={{
                                    animationDelay: `${i * 0.1}s`,
                                    ['--feature-color' as string]: feature.color,
                                }}
                            >
                                <div className="landing-feature-icon" style={{ color: feature.color }}>
                                    {feature.icon}
                                </div>
                                <h3 className="landing-feature-title">{feature.title}</h3>
                                <p className="landing-feature-desc">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section id="how-it-works" className={sectionClass('how-it-works')}>
                <div className="landing-how">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">How It Works</span>
                        <h2 className="landing-section-title">Get Started in<br /><span className="landing-hero-gradient">Three Simple Steps</span></h2>
                    </div>

                    <div className="landing-steps">
                        {[
                            {
                                step: '01',
                                title: 'Create Account',
                                desc: 'Sign up in seconds with your email. No credit card required.',
                                icon: <Lock className="w-6 h-6" />,
                                color: '#6366f1',
                            },
                            {
                                step: '02',
                                title: 'Pin on Map',
                                desc: 'Click the map to set a location, then fill in the company details and ratings.',
                                icon: <MapPin className="w-6 h-6" />,
                                color: '#8b5cf6',
                            },
                            {
                                step: '03',
                                title: 'Track & Compare',
                                desc: 'Filter by status, compare ratings, and make better career decisions.',
                                icon: <BarChart3 className="w-6 h-6" />,
                                color: '#22c55e',
                            },
                        ].map((item, i) => (
                            <div key={i} className="landing-step-card" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="landing-step-number">{item.step}</div>
                                <div className="landing-step-icon" style={{ color: item.color, background: `${item.color}15`, borderColor: `${item.color}30` }}>
                                    {item.icon}
                                </div>
                                <h3 className="landing-step-title">{item.title}</h3>
                                <p className="landing-step-desc">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Stats Section ─── */}
            <section id="stats" className={sectionClass('stats')}>
                <div className="landing-stats">
                    <div className="landing-stats-grid">
                        {[
                            { value: 'FMCG', label: 'Fast Moving Consumer Goods' },
                            { value: 'F&B', label: 'Food & Beverage' },
                            { value: 'Mfg', label: 'Manufacturing' },
                            { value: 'Tech', label: 'Food Technology' },
                        ].map((stat, i) => (
                            <div key={i} className="landing-stat-item" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="landing-stat-value">{stat.value}</div>
                                <div className="landing-stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                    <p className="landing-stats-note">Track applications across all food industry sub-sectors</p>
                </div>
            </section>

            {/* ─── CTA Section ─── */}
            <section id="cta" className={sectionClass('cta')}>
                <div className="landing-cta">
                    <div className="landing-cta-glow" />
                    <div className="landing-cta-card">
                        <h2 className="landing-cta-title">Ready to Map Your<br /><span className="landing-hero-gradient">Food Industry Career?</span></h2>
                        <p className="landing-cta-desc">
                            Join today and start tracking your job applications on an interactive map.
                            Free forever for individual users.
                        </p>
                        <button onClick={onGetStarted} className="landing-cta-btn">
                            <span>Get Started — It's Free</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-brand">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 shadow-md">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <span>Food Industry Job Tracker</span>
                    </div>
                    <p className="landing-footer-copy">© 2026 JobTracker. Built with ❤️ for food industry professionals.</p>
                </div>
            </footer>
        </div>
    )
}

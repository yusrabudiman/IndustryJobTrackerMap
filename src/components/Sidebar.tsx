import type { ReactNode } from 'react'

interface SidebarProps {
    isOpen: boolean
    onToggle: () => void
    children: ReactNode
}

export default function Sidebar({ isOpen, onToggle, children }: SidebarProps) {
    return (
        <>
            {/* Toggle button */}
            <button
                onClick={onToggle}
                className="fixed top-4 left-4 z-[1000] w-11 h-11 rounded-xl glass flex items-center justify-center
          text-text hover:text-primary transition-all duration-300 cursor-pointer
          hover:shadow-lg hover:shadow-primary/10 active:scale-95"
                title={isOpen ? 'Close sidebar' : 'Open sidebar'}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                    {isOpen ? (
                        <>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </>
                    ) : (
                        <>
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="15" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </>
                    )}
                </svg>
            </button>

            {/* Backdrop on mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={`fixed top-0 left-0 z-[999] h-full w-[380px] max-w-[85vw] glass overflow-y-auto
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-border/30 bg-surface-light backdrop-blur-md">
                    <div className="flex items-center gap-3 ml-12">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xl shadow-lg shadow-primary/20">
                            🍔
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-text leading-tight">Food Job Tracker</h1>
                            <p className="text-[11px] text-text-muted">Map your career in F&B industry</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-6">
                    {children}
                </div>
            </aside>
        </>
    )
}

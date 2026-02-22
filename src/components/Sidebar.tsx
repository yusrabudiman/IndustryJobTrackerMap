import type { ReactNode } from 'react'
import { Menu, X, Utensils } from 'lucide-react'

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
                {isOpen ? (
                    <X className="w-5 h-5 transition-transform duration-300" />
                ) : (
                    <Menu className="w-5 h-5 transition-transform duration-300" />
                )}
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
                            <Utensils className="w-6 h-6 text-white" />
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

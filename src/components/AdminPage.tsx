import '../admin.css'
import { useState, useEffect, useCallback } from 'react'
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '../lib/api'
import type { AdminUser, AdminStats } from '../types/company'
import { useAuth } from '../context/AuthContext'

interface AdminPageProps {
    onBack: () => void
}

export default function AdminPage({ onBack }: AdminPageProps) {
    const { user } = useAuth()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRole, setFilterRole] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL')
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [modal, setModal] = useState<'none' | 'resetPassword' | 'confirmDelete' | 'editUser'>('none')
    const [newPassword, setNewPassword] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchUsers = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await getAdminUsers()
            setUsers(data.users)
            setStats(data.stats)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    // Recompute stats from current users list (no extra API call)
    const recomputeStats = useCallback((updatedUsers: AdminUser[]) => {
        setStats({
            totalUsers: updatedUsers.length,
            activeUsers: updatedUsers.filter(u => u.isActive).length,
            inactiveUsers: updatedUsers.filter(u => !u.isActive).length,
            neverLoggedIn: updatedUsers.filter(u => !u.lastLoginAt).length,
            adminUsers: updatedUsers.filter(u => u.role === 'ADMIN').length,
        })
    }, [])

    const filteredUsers = users.filter(u => {
        const matchSearch =
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchRole = filterRole === 'ALL' || u.role === filterRole
        const matchStatus =
            filterStatus === 'ALL' ||
            (filterStatus === 'ACTIVE' && u.isActive) ||
            (filterStatus === 'INACTIVE' && !u.isActive)
        return matchSearch && matchRole && matchStatus
    })

    async function handleToggleActive(u: AdminUser) {
        setActionLoading(true)
        try {
            const updated = await updateAdminUser(u.id, { isActive: !u.isActive })
            const newUsers = users.map(x => (x.id === u.id ? updated : x))
            setUsers(newUsers)
            recomputeStats(newUsers)
            showToast(`Account ${updated.isActive ? 'activated' : 'deactivated'} successfully`, 'success')
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    async function handleToggleRole(u: AdminUser) {
        if (u.id === user?.id) {
            showToast("You cannot change your own role", 'error')
            return
        }
        setActionLoading(true)
        try {
            const updated = await updateAdminUser(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })
            const newUsers = users.map(x => (x.id === u.id ? updated : x))
            setUsers(newUsers)
            recomputeStats(newUsers)
            showToast(`Role changed to ${updated.role}`, 'success')
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    async function handleResetPassword() {
        if (!selectedUser || !newPassword) return
        setActionLoading(true)
        try {
            await updateAdminUser(selectedUser.id, { newPassword })
            showToast(`Password reset for ${selectedUser.name}`, 'success')
            setModal('none')
            setNewPassword('')
            setSelectedUser(null)
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    async function handleDeleteUser() {
        if (!selectedUser) return
        setActionLoading(true)
        try {
            await deleteAdminUser(selectedUser.id)
            const newUsers = users.filter(u => u.id !== selectedUser.id)
            setUsers(newUsers)
            recomputeStats(newUsers)
            showToast(`User "${selectedUser.name}" deleted`, 'success')
            setModal('none')
            setSelectedUser(null)
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    function formatDate(dateStr: string | null) {
        if (!dateStr) return 'Never'
        const d = new Date(dateStr)
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    function getInactiveDays(lastLogin: string | null, createdAt: string) {
        const ref = lastLogin ? new Date(lastLogin) : new Date(createdAt)
        const now = new Date()
        const days = Math.floor((now.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24))
        return days
    }

    return (
        <div className="admin-page">
            {/* Toast notification */}
            {toast && (
                <div className={`admin-toast admin-toast-${toast.type}`}>
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-left">
                    <button onClick={onBack} className="admin-back-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <div className="admin-title-group">
                        <div className="admin-badge">👑 Admin Panel</div>
                        <h1 className="admin-page-title">User Management</h1>
                        <p className="admin-subtitle">Manage accounts, reset passwords, and control access</p>
                    </div>
                </div>
                <button onClick={fetchUsers} className="admin-refresh-btn" disabled={isLoading}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }}>
                        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="admin-stats-grid">
                    <div className="admin-stat-card admin-stat-total">
                        <div className="admin-stat-icon">👥</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.totalUsers}</span>
                            <span className="admin-stat-label">Total Users</span>
                        </div>
                    </div>
                    <div className="admin-stat-card admin-stat-active">
                        <div className="admin-stat-icon">🟢</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.activeUsers}</span>
                            <span className="admin-stat-label">Active</span>
                        </div>
                    </div>
                    <div className="admin-stat-card admin-stat-inactive">
                        <div className="admin-stat-icon">🔴</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.inactiveUsers}</span>
                            <span className="admin-stat-label">Deactivated</span>
                        </div>
                    </div>
                    <div className="admin-stat-card admin-stat-never">
                        <div className="admin-stat-icon">⚠️</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.neverLoggedIn}</span>
                            <span className="admin-stat-label">Never Logged In</span>
                        </div>
                    </div>
                    <div className="admin-stat-card admin-stat-admin">
                        <div className="admin-stat-icon">👑</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-value">{stats.adminUsers}</span>
                            <span className="admin-stat-label">Admins</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="admin-filters">
                <div className="admin-search-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="admin-search-input"
                    />
                </div>
                <div className="admin-filter-pills">
                    {(['ALL', 'USER', 'ADMIN'] as const).map(r => (
                        <button
                            key={r}
                            className={`admin-filter-pill ${filterRole === r ? 'active' : ''}`}
                            onClick={() => setFilterRole(r)}
                        >
                            {r === 'ALL' ? 'All Roles' : r === 'ADMIN' ? '👑 Admin' : '👤 User'}
                        </button>
                    ))}
                    <div className="admin-filter-divider" />
                    {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(s => (
                        <button
                            key={s}
                            className={`admin-filter-pill ${filterStatus === s ? 'active' : ''}`}
                            onClick={() => setFilterStatus(s)}
                        >
                            {s === 'ALL' ? 'All Status' : s === 'ACTIVE' ? '🟢 Active' : '🔴 Inactive'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="admin-table-container">
                {isLoading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner-large" />
                        <span>Loading users...</span>
                    </div>
                ) : error ? (
                    <div className="admin-error-state">
                        <span>⚠️ {error}</span>
                        <button onClick={fetchUsers} className="admin-retry-btn">Retry</button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="admin-empty-state">
                        <span>🔍 No users found</span>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Companies</th>
                                <th>Last Login</th>
                                <th>Inactive Days</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => {
                                const isMe = u.id === user?.id
                                const inactiveDays = getInactiveDays(u.lastLoginAt, u.createdAt)
                                const isDormant = inactiveDays >= 30
                                return (
                                    <tr key={u.id} className={!u.isActive ? 'admin-row-inactive' : isDormant ? 'admin-row-dormant' : ''}>
                                        <td>
                                            <div className="admin-user-cell">
                                                <div className="admin-avatar" style={{ background: u.role === 'ADMIN' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="admin-user-info">
                                                    <span className="admin-user-name">
                                                        {u.name}
                                                        {isMe && <span className="admin-you-badge">You</span>}
                                                    </span>
                                                    <span className="admin-user-email">{u.email}</span>
                                                    <span className="admin-user-joined">Joined {formatDate(u.createdAt)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className={`admin-role-badge ${u.role === 'ADMIN' ? 'admin-role-admin' : 'admin-role-user'}`}
                                                onClick={() => handleToggleRole(u)}
                                                disabled={actionLoading || isMe}
                                                title={isMe ? "Cannot change your own role" : `Click to toggle role`}
                                            >
                                                {u.role === 'ADMIN' ? '👑 Admin' : '👤 User'}
                                            </button>
                                        </td>
                                        <td>
                                            <span className={`admin-status-badge ${u.isActive ? 'admin-status-active' : 'admin-status-inactive'}`}>
                                                {u.isActive ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="admin-companies-count">{u._count.companies}</span>
                                        </td>
                                        <td>
                                            <span className={`admin-last-login ${!u.lastLoginAt ? 'admin-never' : ''}`}>
                                                {formatDate(u.lastLoginAt)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`admin-inactive-days ${isDormant ? 'admin-days-warning' : ''}`}>
                                                {isDormant ? `⚠️ ${inactiveDays}d` : `${inactiveDays}d`}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                {/* Reset Password */}
                                                <button
                                                    className="admin-action-btn admin-action-password"
                                                    title="Reset Password"
                                                    onClick={() => { setSelectedUser(u); setModal('resetPassword') }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                </button>
                                                {/* Toggle Active */}
                                                <button
                                                    className={`admin-action-btn ${u.isActive ? 'admin-action-deactivate' : 'admin-action-activate'}`}
                                                    title={u.isActive ? 'Deactivate account' : 'Activate account'}
                                                    onClick={() => handleToggleActive(u)}
                                                    disabled={actionLoading || isMe}
                                                >
                                                    {u.isActive ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                                {/* Delete */}
                                                {!isMe && (
                                                    <button
                                                        className="admin-action-btn admin-action-delete"
                                                        title="Delete user"
                                                        onClick={() => { setSelectedUser(u); setModal('confirmDelete') }}
                                                        disabled={actionLoading}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Reset Password Modal */}
            {modal === 'resetPassword' && selectedUser && (
                <div className="admin-modal-overlay" onClick={() => { setModal('none'); setNewPassword('') }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div className="admin-modal-icon admin-modal-icon-password">🔑</div>
                            <h2 className="admin-modal-title">Reset Password</h2>
                            <p className="admin-modal-subtitle">Set new password for <strong>{selectedUser.name}</strong></p>
                        </div>
                        <div className="admin-modal-body">
                            <label className="admin-modal-label">New Password</label>
                            <input
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="admin-modal-input"
                                autoFocus
                                minLength={6}
                            />
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-modal-cancel" onClick={() => { setModal('none'); setNewPassword('') }}>Cancel</button>
                            <button
                                className="admin-modal-confirm admin-modal-confirm-primary"
                                onClick={handleResetPassword}
                                disabled={actionLoading || newPassword.length < 6}
                            >
                                {actionLoading ? '...' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {modal === 'confirmDelete' && selectedUser && (
                <div className="admin-modal-overlay" onClick={() => setModal('none')}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div className="admin-modal-icon admin-modal-icon-danger">🗑️</div>
                            <h2 className="admin-modal-title">Delete User</h2>
                            <p className="admin-modal-subtitle">
                                This will permanently delete <strong>{selectedUser.name}</strong> and all their{' '}
                                <strong>{selectedUser._count.companies} companies</strong>. This cannot be undone.
                            </p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-modal-cancel" onClick={() => setModal('none')}>Cancel</button>
                            <button
                                className="admin-modal-confirm admin-modal-confirm-danger"
                                onClick={handleDeleteUser}
                                disabled={actionLoading}
                            >
                                {actionLoading ? '...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

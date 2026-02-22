import { useState, useEffect, useRef } from 'react'
import { X, MessageSquare, Send, Loader2 } from 'lucide-react'
import type { Company, Comment } from '../types/company'
import { getComments, addComment } from '../lib/api'

interface DiscussionModalProps {
    company: Company
    onClose: () => void
}

export default function DiscussionModal({ company, onClose }: DiscussionModalProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<Comment | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scrollBottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const data = await getComments(company.id)
                setComments(data)
            } catch (err) {
                console.error('Failed to load comments:', err)
                setError('Failed to load discussion')
            } finally {
                setIsLoading(false)
            }
        }
        fetchComments()
    }, [company.id])

    // Auto scroll to bottom when comments change
    useEffect(() => {
        if (!isLoading) {
            scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [comments, isLoading])

    const handleReply = (comment: Comment) => {
        setReplyTo(comment)
        setNewComment(`@${comment.user.name} `)
        // Focus textarea
        const textarea = document.querySelector('textarea')
        textarea?.focus()
    }

    const cancelReply = () => {
        setReplyTo(null)
        setNewComment('')
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        setIsSubmitting(true)
        setError(null)
        try {
            const added = await addComment(company.id, newComment, replyTo?.id)
            setComments(prev => [...prev, added])
            setNewComment('')
            setReplyTo(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to post comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-border/50 flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-border/30 bg-surface-light/50 flex items-center justify-between">
                    <div className="max-w-[80%]">
                        <h2 className="text-xl font-bold text-text truncate">{company.name}</h2>
                        <p className="text-xs text-text-muted mt-1 font-medium">Community Discussion & Industry Insights</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-surface-lighter flex items-center justify-center transition-colors cursor-pointer group">
                        <X className="w-5 h-5 text-text-muted group-hover:text-text transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Original Note */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider text-primary font-bold">
                            <MessageSquare className="w-3 h-3" />
                            <span>OP's Notes</span>
                        </div>
                        <p className="text-sm text-text italic leading-relaxed">
                            "{company.notes || 'No notes provided'}"
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-text border-l-2 border-primary pl-3">Discussion ({comments.length})</h3>

                        {isLoading ? (
                            <div className="py-10 text-center animate-pulse flex flex-col items-center gap-3">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                <span className="text-text-muted text-sm">Loading discussion...</span>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="py-10 text-center bg-surface-light rounded-2xl border border-dashed border-border/50">
                                <p className="text-text-muted text-sm italic">No opinions yet. Be the first to share your experience!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className={`group p-4 rounded-2xl bg-surface-light hover:bg-surface-lighter transition-colors border border-border/10 ${comment.parentId ? 'ml-8 bg-surface-light/40 border-l-2 border-l-primary/30' : ''}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {comment.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-text">{comment.user.name}</span>
                                                {comment.parentId && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-tight">Reply</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-text-muted">
                                                    {formatTime(comment.createdAt)}
                                                </span>
                                                <button
                                                    onClick={() => handleReply(comment)}
                                                    className="text-[10px] text-primary font-bold hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {comment.content.startsWith('@') ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                                                        {comment.content.split(' ')[0]}
                                                    </span>
                                                    <p className="text-sm text-text-muted leading-relaxed pl-1">
                                                        {comment.content.substring(comment.content.indexOf(' ') + 1)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-text-muted leading-relaxed">
                                                    {comment.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollBottomRef} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Input */}
                <div className="p-6 border-t border-border/30 bg-surface-light/30">
                    {replyTo && (
                        <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-[10px] text-primary font-bold">
                                Replying to <span className="underline">{replyTo.user.name}</span>
                            </p>
                            <button onClick={cancelReply} className="text-[10px] text-primary hover:text-danger font-bold cursor-pointer">Cancel</button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `Write your reply...` : "Add your opinion or correct this info..."}
                            className="w-full p-4 pr-16 rounded-2xl bg-surface border border-border/50 focus:border-primary/50 outline-none text-sm transition-all min-h-[100px] resize-none"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:bg-text-muted cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-4.5 h-4.5" />
                            )}
                        </button>
                    </form>
                    {error && <p className="mt-2 text-[10px] text-danger text-center font-bold">{error}</p>}
                </div>
            </div>
        </div>
    )
}

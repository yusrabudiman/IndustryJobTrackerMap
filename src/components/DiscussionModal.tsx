import { useState, useEffect, useRef } from 'react'
import { X, MessageSquare, Send, Loader2, ImagePlus } from 'lucide-react'
import type { Company, Comment } from '../types/company'
import { getComments, addComment } from '../lib/api'

interface DiscussionModalProps {
    company: Company
    onClose: () => void
}

function ZoomableImage({ src, onClose }: { src: string; onClose: () => void }) {
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const preventScroll = (e: WheelEvent) => {
            e.preventDefault()
        }
        const el = document.getElementById('zoom-container')
        if (el) {
            el.addEventListener('wheel', preventScroll, { passive: false })
        }
        return () => {
            if (el) el.removeEventListener('wheel', preventScroll)
        }
    }, [])

    const handlePointerDown = (e: React.PointerEvent) => {
        if (scale > 1) {
            setIsDragging(true)
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
            e.currentTarget.setPointerCapture(e.pointerId)
        }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false)
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    const handleWheel = (e: React.WheelEvent) => {
        // Zoom with scroll wheel
        const scaleChange = e.deltaY * -0.002
        const newScale = Math.min(Math.max(1, scale + scaleChange), 5)
        
        // Reset position when zoomed all the way out
        if (newScale === 1) {
            setPosition({ x: 0, y: 0 })
        }
        setScale(newScale)
    }

    return (
        <div 
            id="zoom-container"
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200 overflow-hidden"
        >
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-[3010] w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors border border-white/10 cursor-pointer"
                title="Close (X)"
            >
                <X className="w-6 h-6" />
            </button>
            <img 
                src={src} 
                alt="Zoomed preview" 
                className="max-w-full max-h-full object-contain select-none animate-in zoom-in-95 duration-200"
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                draggable={false}
            />
        </div>
    )
}

export default function DiscussionModal({ company, onClose }: DiscussionModalProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<Comment | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [images, setImages] = useState<File[]>([])
    const [zoomedImage, setZoomedImage] = useState<string | null>(null)
    const scrollBottomRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            // Limit to 4 images for example
            setImages(prev => [...prev, ...files].slice(0, 4))
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const img = new Image()
                img.src = reader.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 800
                    const MAX_HEIGHT = 800
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/webp', 0.8))
                }
                img.onerror = (e) => reject(e)
            }
            reader.onerror = error => reject(error)
        })
    }

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
        if (!newComment.trim() && images.length === 0) return

        setIsSubmitting(true)
        setError(null)
        try {
            const base64Images = await Promise.all(images.map(fileToBase64))
            const added = await addComment(company.id, newComment, replyTo?.id, base64Images)
            setComments(prev => [...prev, added])
            setNewComment('')
            setImages([])
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
                                                comment.content && (
                                                    <p className="text-sm text-text-muted leading-relaxed">
                                                        {comment.content}
                                                    </p>
                                                )
                                            )}
                                            {/* Images display */}
                                            {comment.images && comment.images.length > 0 && (
                                                <div className="flex overflow-x-auto gap-2 mt-2 pb-2 custom-scrollbar snap-x">
                                                    {comment.images.map((img, idx) => (
                                                        <div key={idx} className="shrink-0 snap-center">
                                                            <img 
                                                                src={img} 
                                                                alt={`Comment attachment ${idx + 1}`} 
                                                                onClick={() => setZoomedImage(img)}
                                                                className="rounded-xl object-cover border border-border/50 max-h-48 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
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
                    {/* Selected images preview */}
                    {images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto mb-3 pb-2 custom-scrollbar">
                            {images.map((file, idx) => (
                                <div key={idx} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-border/50 group">
                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `Write your reply...` : "Add your opinion or correct this info..."}
                            className="w-full p-4 pl-12 pr-16 rounded-2xl bg-surface border border-border/50 focus:border-primary/50 outline-none text-sm transition-all min-h-[100px] resize-none"
                            disabled={isSubmitting}
                        />
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            className="hidden" 
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting || images.length >= 4}
                            className="absolute bottom-4 left-4 w-8 h-8 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                            <ImagePlus className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!newComment.trim() && images.length === 0)}
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

            {/* Zoomed Image Overlay */}
            {zoomedImage && (
                <ZoomableImage src={zoomedImage} onClose={() => setZoomedImage(null)} />
            )}
        </div>
    )
}

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Info, Maximize2, Minimize2, Download } from 'lucide-react'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
// Using gemini-2.5-flash as the latest cutting-edge model
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `
[SYSTEM CONTEXT - MODEL CONTEXT PROTOCOL INSTRUCTION]
Identity: JobTracker AI Assistant
Website: IndustryJobTrackerMap (JobTracker)

PURPOSE:
You help users understand how to use this platform to track food industry job applications.

FORMATTING RULES:
- Use **bold** for emphasis or headers.
- Use bullet points for lists.
- Keep paragraphs short and space them out for readability.
- Be extremely clear and step-by-step.

CORE WORKFLOW:
1. Registration: Create an account.
2. Interactive Map: Click anywhere on the map to "Drop a Pin".
3. Form: Enter Company Name, Sub-sector, and Ratings (1-5 stars).
4. Status Pipeline: Applied (Blue) → Interview (Yellow) → Offered/Joined (Green) → Rejected (Red).
5. Public/Private Toggle: Control visibility.

SUB-SECTORS: FMCG, F&B, Manufacturing, Food Tech.
REFERENCE: https://github.com/yusrabudiman/IndustryJobTrackerMap

CONSTRAINTS: 
- Indonesian (Bahasa Indonesia) is primary.
- Always be encouraging and helpful.
`

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const SUGGESTIONS = [
    { label: "📍 Cara pakai map?", query: "Bagaimana cara kerja map?" },
    { label: "💳 Apakah gratis?", query: "Apakah website ini gratis?" },
    { label: "📊 Apa itu rating?", query: "Apa saja kriteria rating perusahaan?" },
    { label: "🔐 Keamanan data?", query: "Apakah data saya aman dan privat?" },
    { label: "🚀 Cara mulai?", query: "Bagaimana cara memulai pendaftaran?" },
];

export default function AIChatAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Halo! Saya **JobTracker AI**. Ada yang bisa saya bantu untuk menjelaskan cara kerja website ini?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const downloadTranscript = async () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        // Formatted HTML that Microsoft Word can interpret as a rich document
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Transkrip JobTracker</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 800px; margin: auto; padding: 20px; }
                .header { text-align: center; color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; }
                .meta { background: #f3f4f6; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 10pt; }
                .message { margin-bottom: 20px; padding: 15px; border-radius: 10px; border: 1px solid #eee; }
                .assistant { border-left: 5px solid #4F46E5; background: #f8faff; }
                .user { border-left: 5px solid #10B981; background: #f0fdf4; }
                .role { font-weight: bold; margin-bottom: 5px; font-size: 11pt; }
                .assistant-role { color: #4338CA; }
                .user-role { color: #059669; }
                .footer { margin-top: 40px; text-align: center; font-size: 8pt; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>Transkrip Diskusi JobTracker AI</h1></div>
                    <div class="meta">
                        <p><strong>Tanggal:</strong> ${dateStr} | <strong>Waktu:</strong> ${timeStr}</p>
                        <p><strong>Platform:</strong> IndustryJobTrackerMap</p>
                    </div>
                    ${messages.map((m, idx) => `
                        <div class="message ${m.role === 'assistant' ? 'assistant' : 'user'}">
                            <p class="role ${m.role === 'assistant' ? 'assistant-role' : 'user-role'}">
                                ${m.role === 'assistant' ? '🤖 JOBTRACKER AI' : '👤 ANDA'}
                            </p>
                            <div>${m.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                        </div>
                    `).join('')}
                    <div class="footer">Dicetak secara otomatis oleh Sistem JobTracker AI</div>
                </div>
            </body>
            </html>
        `;

        const fileName = `Transkrip-JobTracker-${dateStr.replace(/ /g, '-')}.doc`;

        try {
            // Attempt to use the modern File System Access API (opens "Save As" dialog)
            if ('showSaveFilePicker' in window) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'Word Document',
                        accept: { 'application/msword': ['.doc'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(htmlContent);
                await writable.close();
            } else {
                // Fallback for older browsers or non-secure contexts
                const blob = new Blob([htmlContent], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            // Silent catch for user cancellation (AbortError)
            if ((err as any).name === 'AbortError') return;
            console.error('Gagal mengunduh transkrip:', err);
            
            // Final fallback if everything fails
            const blob = new Blob([htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            window.open(url);
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isOpen])

    const handleSendMessage = async (customQuery?: string) => {
        const query = (customQuery || input).trim()
        if (!query || isLoading) return

        if (!GEMINI_API_KEY) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Konfigurasi API Key belum lengkap.' }])
            return
        }

        try {
            if (!customQuery) setInput('')
            setShowSuggestions(false)
            setMessages(prev => [...prev, { role: 'user', content: query }])
            setIsLoading(true)

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: { text: SYSTEM_PROMPT } },
                    contents: [{ role: 'user', parts: [{ text: query }] }],
                    generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error?.message || 'API Error')

            const assistantContent = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (assistantContent) {
                setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Maaf, terjadi masalah: ${error.message}` }])
        } finally {
            setIsLoading(false)
        }
    }

    // Enhanced renderer for bold, emojis, and better spacing
    const renderContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            if (line.trim() === '') return <div key={i} className="h-2" />;

            // Simple Markdown-like parsing
            const parts = line.split(/(\*\*.*?\*\*|:[a-z0-9_]+:)/g);
            
            return (
                <div key={i} className="mb-1 last:mb-0">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <strong key={j} className="font-bold text-indigo-500 dark:text-indigo-300">
                                    {part.slice(2, -2)}
                                </strong>
                            );
                        }
                        // Simple emoji or bullet point clean up
                        if (part.startsWith('- ')) {
                            return <span key={j} className="inline-block ml-1 mr-2">•</span>;
                        }
                        return part;
                    })}
                </div>
            );
        });
    }

    return (
        <div className={`z-[6000] font-sans transition-all duration-500 ${
            isFullScreen 
                ? 'fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-8' 
                : 'fixed bottom-6 right-6 flex flex-col items-end'
        }`}>
            {/* Chat Window */}
            {isOpen && (
                <div className={`flex flex-col bg-surface border border-border/40 shadow-2xl overflow-hidden glass ai-chat-window transition-all duration-500 ${
                    isFullScreen 
                        ? 'w-full max-w-5xl h-[90vh] rounded-[3rem]' 
                        : 'mb-4 w-[350px] sm:w-[420px] h-[580px] rounded-[2rem]'
                }`}>
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                        {/* Decorative background light */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-inner group-hover:scale-105 transition-transform">
                                <Bot className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight leading-none">JobTracker AI</h3>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-indigo-100/90 uppercase tracking-widest">Online & Aktif</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 relative z-10">
                            <button
                                onClick={downloadTranscript}
                                title="Download Transkrip"
                                className="p-2.5 hover:bg-white/10 rounded-2xl transition-all cursor-pointer active:scale-90 group/btn"
                            >
                                <Download className="w-5 h-5 text-white/90 group-hover/btn:scale-110 transition-transform" />
                            </button>

                            <button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                title={isFullScreen ? "Minimize" : "Full Screen"}
                                className="p-2.5 hover:bg-white/10 rounded-2xl transition-all cursor-pointer active:scale-90 group/btn"
                            >
                                {isFullScreen ? (
                                    <Minimize2 className="w-6 h-6 text-white/90 group-hover/btn:scale-110 transition-transform" />
                                ) : (
                                    <Maximize2 className="w-6 h-6 text-white/90 group-hover/btn:scale-110 transition-transform" />
                                )}
                            </button>

                            <button
                                onClick={() => { setIsOpen(false); setIsFullScreen(false); }}
                                className="p-2.5 hover:bg-white/10 rounded-2xl transition-all cursor-pointer active:scale-90 group/close"
                            >
                                <X className="w-6 h-6 text-white/90" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-surface/40 no-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-500`}>
                                <div className={`flex gap-3 w-full ${msg.role === 'user' ? 'flex-row-reverse pl-8' : 'flex-row pr-4'}`}>
                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                        msg.role === 'user' 
                                            ? 'bg-primary border border-white/20' 
                                            : 'bg-surface-lighter border border-border/40'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-indigo-400" />}
                                    </div>
                                    <div className={`relative p-4 rounded-3xl text-[14px] leading-relaxed shadow-md flex-1 ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-surface-light border border-border/40 text-text rounded-tl-none'
                                    }`}>
                                        {renderContent(msg.content)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex gap-3 w-full pr-12">
                                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-surface-lighter border border-border/40 shadow-sm">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="p-4 rounded-3xl bg-surface-light border border-border/30 text-text rounded-tl-none flex items-center h-[52px]">
                                        <div className="flex gap-2">
                                            <div className="ai-typing-dot bg-indigo-400"></div>
                                            <div className="ai-typing-dot bg-indigo-400"></div>
                                            <div className="ai-typing-dot bg-indigo-400"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Floating Suggestion Menu (Overlay inside chat) */}
                        {showSuggestions && !isLoading && (
                            <div className="absolute bottom-24 left-4 right-4 z-20 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-surface-lighter/95 backdrop-blur-xl border border-primary/20 rounded-[2rem] p-4 shadow-2xl ring-1 ring-black/5">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Saran Cepat:</p>
                                        </div>
                                        <button onClick={() => setShowSuggestions(false)} className="text-text-muted hover:text-primary transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto no-scrollbar py-1">
                                        {SUGGESTIONS.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSendMessage(s.query)}
                                                className="px-4 py-2 bg-white/5 border border-border/40 rounded-full text-[12px] font-medium text-text-muted hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer shadow-sm flex-shrink-0"
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Triangle pointer */}
                                <div className="absolute -bottom-2 right-12 w-4 h-4 bg-surface-lighter/95 border-b border-r border-primary/20 rotate-45 z-10 hidden sm:block"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Form Area */}
                    <div className="p-6 bg-surface border-t border-border/20 relative">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="flex items-center gap-3 bg-surface-lighter/50 p-1 rounded-[1.5rem] border border-border/30 focus-within:border-primary/40 transition-all"
                        >
                            <button
                                type="button"
                                onClick={() => setShowSuggestions(!showSuggestions)}
                                className={`ml-1 p-2.5 rounded-xl transition-all active:scale-95 ${
                                    showSuggestions ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-light'
                                }`}
                                title="Lihat Saran Pertanyaan"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tanyakan pada AI..."
                                className="flex-1 bg-transparent px-2 py-2.5 text-[14px] focus:outline-none placeholder:text-text-muted/50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 bg-primary text-white rounded-2xl hover:bg-primary-dark disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-primary/30 cursor-pointer active:scale-90"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative flex items-center justify-center p-5 rounded-[1.8rem] font-bold shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 group cursor-pointer border-2 ${
                    isOpen
                        ? 'bg-surface text-text border-indigo-500/30'
                        : 'bg-primary text-white border-primary-light/20'
                }`}
                style={{ minWidth: isOpen ? '72px' : '72px', height: '72px' }}
            >
                <div className="relative">
                    {isOpen ? (
                        <X className="w-8 h-8 animate-in spin-in-90 duration-300" />
                    ) : (
                        <>
                            <Bot className="w-9 h-9 animate-in zoom-in-50 duration-300" />
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-4 border-primary animate-pulse shadow-lg" />
                        </>
                    )}
                </div>
                {!isOpen && (
                    <div className="absolute right-full mr-4 bg-surface/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-border/40 text-text text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-x-4 group-hover:translate-x-0 shadow-xl">
                        Tanya JobTracker AI
                    </div>
                )}
            </button>
        </div>
    )
}



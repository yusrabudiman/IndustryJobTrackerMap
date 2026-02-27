import React, { useState, useEffect, useRef } from 'react';
import { Send, Info, Phone, Video } from 'lucide-react';
import { Message, Participant } from '../../types/chat';

interface ChatWindowProps {
    conversationId: string;
    messages: Message[];
    onSendMessage: (content: string) => void;
    currentUserId: string;
    partner: Participant | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    messages,
    onSendMessage,
    currentUserId,
    partner
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    if (!conversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                <div className="w-20 h-20 rounded-full border-2 border-text-muted/30 flex items-center justify-center mb-4">
                    <Send className="w-10 h-10 -rotate-45" />
                </div>
                <h2 className="text-xl font-semibold text-text">Your Messages</h2>
                <p className="text-sm">Send private photos and messages to a friend.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-surface">
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-base font-bold shadow-lg shadow-primary/20">
                        {partner?.name ? partner.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <div className="font-bold text-text">{partner?.name || 'User'}</div>
                        <div className="text-[10px] text-success flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                            Active Now
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-surface-light border border-border/30 text-text rounded-bl-none'
                                    }`}
                            >
                                {msg.content}
                                <div className={`text-[10px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4">
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 border border-border/50 rounded-full px-4 py-2 focus-within:border-primary/50 transition-colors"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="text-primary font-semibold text-sm disabled:opacity-30 transition-opacity"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

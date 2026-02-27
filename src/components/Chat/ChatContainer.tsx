import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, MessageCircle } from 'lucide-react';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { Conversation, Message } from '../../types/chat';
import { getConversations, getMessages, sendMessage, searchUsers, createConversation } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../lib/socket';

interface ChatContainerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const loadConversations = useCallback(async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    }, []);

    const loadMessages = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const data = await getMessages(id);
            setMessages(data);
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
            const socket = socketService.connect();

            socket.on('receive_message', (payload: any) => {
                if (payload.conversationId === activeConvId) {
                    setMessages(prev => {
                        // Hindari duplikasi pesan (terutama untuk pesan optimis/live)
                        const isDuplicate = prev.some(m =>
                            m.id === payload.id ||
                            (m.id.startsWith('temp-') && m.senderId === payload.senderId && m.content === payload.content)
                        );
                        if (isDuplicate) return prev;
                        return [...prev, payload];
                    });
                }
                // Perbarui daftar percakapan untuk pratinjau pesan terbaru
                loadConversations();
            });

            return () => {
                socket.off('receive_message');
            };
        }
    }, [isOpen, activeConvId, loadConversations]);

    useEffect(() => {
        if (activeConvId) {
            loadMessages(activeConvId);
            const socket = socketService.getSocket();
            if (socket) {
                socket.emit('join_room', activeConvId);
            }
        }
    }, [activeConvId, loadMessages]);

    const handleSendMessage = async (content: string) => {
        if (!activeConvId || !user) return;

        // Buat pesan optimis untuk pengiriman LIVE (instan)
        const tempId = `temp-${Date.now()}`;
        const liveMsg: Message = {
            id: tempId,
            content,
            senderId: user.id,
            conversationId: activeConvId,
            createdAt: new Date().toISOString(),
            isRead: false,
            sender: { id: user.id, name: user.name || 'Me' }
        };

        // 1. Emit via socket SEGERA (Live relay tanpa menunggu database)
        const socket = socketService.getSocket();
        if (socket) {
            socket.emit('send_message', liveMsg);
        }

        // 2. Update status lokal segera agar terasa instan
        setMessages(prev => [...prev, liveMsg]);

        try {
            // 3. Simpan ke database di latar belakang
            const actualMsg = await sendMessage(activeConvId, content);

            // 4. Sinkronkan ID pesan dari DB ke state UI
            setMessages(prev => prev.map(m => m.id === tempId ? actualMsg : m));

            // Segarkan daftar sidebar
            loadConversations();
        } catch (err) {
            console.error('Simpan DB gagal, tapi pesan sudah terkirim live via socket:', err);
        }
    };

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const results = await searchUsers(q);
            setSearchResults(results.filter((r: any) => r.id !== user?.id));
        } catch (err) {
            console.error('Search failed:', err);
        }
    };

    const startNewChat = async (targetUser: any) => {
        try {
            setSelectedUser(targetUser);
            const conv = await createConversation(targetUser.id);
            setActiveConvId(conv.id);
            setSearchQuery('');
            setSearchResults([]);
            loadConversations();
        } catch (err) {
            console.error('Failed to start chat:', err);
        }
    };

    if (!isOpen) return null;

    const activeConv = conversations.find(c => c.id === activeConvId);

    // Final logic for partner identification
    const partner = activeConv?.participants.find(p => p.id !== user?.id) || selectedUser;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-5xl h-full max-h-[800px] glass rounded-2xl overflow-hidden flex shadow-2xl flex-col md:flex-row">
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-surface-lighter transition-colors md:hidden"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Sidebar */}
                <div className={`w-full md:w-80 h-full flex flex-col border-r border-border/30 bg-surface/50 backdrop-blur-md ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-border/30 flex items-center justify-between bg-surface-light/30">
                        <h2 className="text-lg font-bold tracking-tight">Messages</h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-surface-lighter rounded-lg transition-colors hidden md:block">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 border-b border-border/10">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Find people..."
                                className="w-full bg-surface-light border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/5 transition-all outline-none"
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-2 absolute z-10 w-64 bg-surface-light border border-border/50 rounded-lg shadow-xl overflow-hidden">
                                {searchResults.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => startNewChat(u)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-surface-lighter transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{u.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <ChatList
                        conversations={conversations}
                        activeId={activeConvId}
                        onSelect={setActiveConvId}
                        currentUserId={user?.id || ''}
                    />
                </div>

                {/* Window */}
                <div className={`flex-1 h-full bg-surface/30 backdrop-blur-sm ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
                    {activeConvId && (
                        <button
                            onClick={() => setActiveConvId(null)}
                            className="absolute top-4 left-4 z-10 md:hidden p-2 rounded-full bg-surface-light shadow-md"
                        >
                            <X className="w-5 h-5 rotate-90" />
                        </button>
                    )}
                    <ChatWindow
                        conversationId={activeConvId || ''}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        currentUserId={user?.id || ''}
                        partner={partner}
                    />
                </div>
            </div>
        </div>
    );
};

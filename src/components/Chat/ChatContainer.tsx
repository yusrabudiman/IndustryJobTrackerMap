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
    onOpen?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ isOpen, onClose, onOpen }) => {
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
        if (isOpen && onOpen) onOpen();
    }, [isOpen, onOpen]);

    // Background socket logic - Always run regardless of isOpen
    useEffect(() => {
        loadConversations();
        const socket = socketService.connect();

        const handleReceiveMessage = (payload: any) => {
            console.log('[Chat] Received message:', payload);
            if (payload.conversationId === activeConvId) {
                setMessages(prev => {
                    const isDuplicate = prev.some(m =>
                        m.id === payload.id ||
                        (m.id.startsWith('temp-') && m.senderId === payload.senderId && m.content === payload.content)
                    );
                    if (isDuplicate) return prev;
                    return [...prev, payload];
                });
            }
            loadConversations();
        };

        const handleNotification = (data: any) => {
            console.log('[Chat] Received notification:', data);
            loadConversations();
            if (data.type === 'new_conversation' || data.type === 'new_message') {
                socket.emit('join_room', data.conversationId);
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('notification', handleNotification);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('notification', handleNotification);
        };
    }, [activeConvId, loadConversations]); // Re-bind if activeConvId changes

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
            
            // Notify other party immediately
            const socket = socketService.getSocket();
            if (socket) {
                socket.emit('new_conversation', { 
                    conversationId: conv.id, 
                    participantId: targetUser.id 
                });
            }

            loadConversations();
        } catch (err) {
            console.error('Failed to start chat:', err);
        }
    };

    const activeConv = conversations.find(c => c.id === activeConvId);
    const partner = activeConv?.participants.find(p => p.id !== user?.id) || selectedUser;

    // Use CSS classes to hide/show instead of React null render so sockets and state persist
    return (
        <div className={`fixed bottom-[90px] right-4 md:right-6 z-[4900] pointer-events-none flex items-end justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 select-none pointer-events-none translate-y-4'}`} style={{ display: isOpen ? 'flex' : 'none' }}>
            <div className={`relative w-[calc(100vw-2rem)] md:w-[750px] h-[550px] max-h-[80vh] bg-surface/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-black/20 flex-col md:flex-row border border-border/50 animate-in slide-in-from-bottom-5 duration-300 ${isOpen ? 'flex pointer-events-auto' : 'hidden'}`}>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-surface-lighter transition-colors md:hidden text-text cursor-pointer bg-surface/50 backdrop-blur-sm border border-border/20"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Sidebar */}
                <div className={`w-full md:w-80 h-full flex flex-col border-r border-border/30 bg-surface/50 backdrop-blur-md ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-border/30 flex items-center justify-between bg-surface-light/30">
                        <h2 className="text-lg font-bold tracking-tight">Messages</h2>
                        <button onClick={onClose} className="p-1.5 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors hidden md:block cursor-pointer" title="Close chat">
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
                <div className={`relative flex-1 h-full bg-surface/30 backdrop-blur-sm ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
                    {activeConvId && (
                        <button
                            onClick={() => setActiveConvId(null)}
                            className="absolute top-4 left-4 z-50 md:hidden p-2 rounded-full bg-surface/80 backdrop-blur-md shadow-md hover:bg-surface-light transition-colors cursor-pointer border border-border/30 text-text"
                            title="Back to Messages"
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

import React from 'react';
import { Search } from 'lucide-react';
import { Conversation } from '../../types/chat';

interface ChatListProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    currentUserId: string;
}

export const ChatList: React.FC<ChatListProps> = ({ conversations, activeId, onSelect, currentUserId }) => {
    return (
        <div className="flex flex-col h-full border-r border-border/30 w-full md:w-80">
            <div className="flex-1 overflow-y-auto pt-2">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-sm">
                        No conversations yet.
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const partner = conv.participants.find(p => p.id !== currentUserId);
                        const lastMsg = conv.messages[0];

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-surface-lighter transition-colors text-left ${activeId === conv.id ? 'bg-surface-lighter border-r-2 border-primary' : ''
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                                    {partner?.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-width-0 flex-1">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-semibold truncate">{partner?.name}</span>
                                        <span className="text-[10px] text-text-muted">
                                            {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-muted truncate">
                                        {lastMsg ? `${lastMsg.sender.name}: ${lastMsg.content}` : 'No messages'}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

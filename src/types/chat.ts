export interface Participant {
    id: string;
    name: string;
}

export interface LatestMessage {
    content: string;
    createdAt: string;
    sender: {
        name: string;
    };
}

export interface Conversation {
    id: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
    participants: Participant[];
    messages: LatestMessage[]; // Used for the preview in list
}

export interface Message {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
    sender: Participant;
    conversationId: string;
}

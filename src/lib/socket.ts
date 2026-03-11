import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            // Determine API URL: Use port 3001 on the same host in development
            const url = window.location.port === '5173' 
                ? `${window.location.protocol}//${window.location.hostname}:3001`
                : '';
            
            console.log('[Socket] Attempting connection to:', url || 'same-origin');
            
            this.socket = io(url, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('[Socket] Connected to server');
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error);
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
export default socketService;

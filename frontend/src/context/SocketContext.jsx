import { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (token) {
            const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
                auth: { token },
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else if (socket) {
            socket.disconnect();
            setSocket(null);
        }
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(userId: number): Socket {
    if (socket && socket.connected) {
        return socket;
    }

    socket = io(import.meta.env.VITE_PUBLIC_BASE_URL || '', {
        path: "/socket.io",
        withCredentials: true,
        transports: ['websocket'],
    });

    socket.on("connect", () => {
        console.log("Connected to socket server");
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from socket server");
    });

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function joinRoom(userId: number) {
    if (socket) {
        socket.emit("join", { user_id: userId });
    }
}

export function leaveRoom(userId: number) {
    if (socket) {
        socket.emit("leave", { user_id: userId });
    }
}

export function onMessageEvent(callback: (message: string) => void) {
    if (socket) {
        socket.on("message_event", callback);
    }
}

export function offMessageEvent() {
    if (socket) {
        socket.off("message_event");
    }
}

export function onChatAddedEvent(callback: (message: string) => void) {
    if (socket) {
        socket.on("chat_added", callback);
    }
}

export function offChatAddedEvent() {
    if (socket) {
        socket.off("chat_added");
    }
}


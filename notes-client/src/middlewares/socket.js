import { encryptData } from "./crypto";

export const socket = () => {
    const ws = new WebSocket("ws://localhost:3000/api/notes/socket");
    return ws;
};

export const waitForOpenSocket = async (socket) => {
    return new Promise((resolve) => {
        if (socket?.readyState !== socket?.OPEN) {
            socket?.on("open", (_) => {
                resolve();
            });
        } else {
            resolve();
        }
    });
};

export const sendMessage = async (socket, message, password) => {
    await waitForOpenSocket(socket);
    const encryptedMessage = {
        ...message,
        new: {
            ...message.new,
            title: await encryptData(message?.new?.title, password),
            content: await encryptData(message?.new?.content, password),
        },
    };
    socket?.send(JSON.stringify(encryptedMessage));
};

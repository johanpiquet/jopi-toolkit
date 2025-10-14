export function onError(socket: WebSocket, listener: () => void): void {
    socket.onerror = listener;
}

export function sendMessage(socket: WebSocket, msg: string|Buffer|Uint8Array|ArrayBuffer): void {
    socket.send(msg);
}

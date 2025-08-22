export function init_webSocket() {
    NodeSpace.webSocket = {
        onClosed(socket: WebSocket, listener: (socket: WebSocket) => void): void {
            socket.addEventListener('close', () => {
                listener(socket);
            });
        },

        sendTextMessage(socket: WebSocket, text: string): void {
            socket.send(text);
        },

        onTextMessage(socket: WebSocket, listener: (text: string) => void): void {
            socket.addEventListener('message', (event) => {
                listener(event.data);
            });
        }
    };
}
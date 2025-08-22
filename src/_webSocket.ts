export function init_webSocket() {
    NodeSpace.webSocket = {
        openConnection(wsUrl: string, protocol): WebSocket {
            return new WebSocket(wsUrl, protocol);
        },

        onClosed(socket, listener): void {
            socket.addEventListener('close', () => { listener() });
        },

        sendMessage(socket, msg): void {
            socket.send(msg);
        },

        onMessage(socket, listener) {
            socket.addEventListener('message', (event) => { listener(event.data) });
        }
    };
}
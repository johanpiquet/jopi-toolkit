export function init_webSocket() {
    NodeSpace.webSocket = {
        openConnection(wsUrl, protocol) {
            return new WebSocket(wsUrl, protocol);
        },
        onClosed(socket, listener) {
            socket.addEventListener('close', () => { listener(); });
        },
        sendMessage(socket, msg) {
            socket.send(msg);
        },
        onMessage(socket, listener) {
            socket.addEventListener('message', (event) => { listener(event.data); });
        }
    };
}
//# sourceMappingURL=_webSocket.js.map
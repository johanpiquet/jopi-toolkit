export function init_webSocket() {
    NodeSpace.webSocket = {
        onClosed(socket, listener) {
            socket.addEventListener('close', () => { listener(); });
        },
        sendTextMessage(socket, text) {
            socket.send(text);
        },
        onMessage(socket, listener) {
            socket.addEventListener('message', (event) => { listener(event.data); });
        }
    };
}
//# sourceMappingURL=_webSocket.js.map
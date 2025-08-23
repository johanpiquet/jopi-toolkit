export function init_webSocket() {
    NodeSpace.webSocket = {
        openConnection(wsUrl, protocol) {
            return new Promise((resolve, reject) => {
                const ws = new WebSocket(wsUrl, protocol);
                ws.onopen = () => { resolve(ws); };
                ws.onerror = () => { reject(); };
            });
        },
        onError(socket, listener) {
            socket.onerror = listener;
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
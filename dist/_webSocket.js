export function init_webSocket() {
    NodeSpace.webSocket = {
        onClosed(socket, listener) {
            socket.addEventListener('close', () => {
                listener(socket);
            });
        },
        sendTextMessage(socket, text) {
            socket.send(text);
        },
        onTextMessage(socket, listener) {
            socket.addEventListener('message', (event) => {
                listener(event.data);
            });
        }
    };
}
//# sourceMappingURL=_webSocket.js.map
export function init_webSocket() {
    NodeSpace.webSocket = {
        onClosed(socket, listener): void {
            socket.addEventListener('close', () => { listener() });
        },

        sendTextMessage(socket, text): void {
            socket.send(text);
        },

        onMessage(socket, listener) {
            socket.addEventListener('message', (event) => { listener(event.data) });
        }
    };
}
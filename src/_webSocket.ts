import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

export function init_webSocket() {
    NodeSpace.webSocket = {
        openConnection(wsUrl: string, protocol): Promise<WebSocket> {
            return new Promise<WebSocket>((resolve, reject) => {
                const ws = new WebSocket(wsUrl, protocol);

                ws.onopen = () => { resolve(ws) };
                ws.onerror = () => { reject(); };
            });
        },

        onError(socket, listener): void {
            socket.onerror = listener;
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
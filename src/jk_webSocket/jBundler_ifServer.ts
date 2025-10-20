import {WebSocket as WsWebSocket} from "ws";
import {isNodeJS} from "jopi-toolkit/jk_what";

//region openConnection

function node_openConnection(wsUrl: string, protocol?: string|string[]): Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WsWebSocket(wsUrl, protocol);
        const ws2 = ws as unknown as WebSocket;

        ws.onopen = () => { resolve(ws2) };
        ws.onerror = () => { reject(); };
    });
}

function bun_openConnection(wsUrl: string, protocol?: string|string[]): Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(wsUrl, protocol);

        ws.onopen = () => { resolve(ws) };
        ws.onerror = () => { reject(); };
    });
}

export const openConnection = isNodeJS ? node_openConnection : bun_openConnection;

//endregion

//region onClose

function node_onClosed(socket: WebSocket, listener: () => void): void {
    socket.addEventListener('close', () => { listener() });
}

function bun_onClosed(socket: WebSocket, listener: () => void): void {
    const data = ((socket as any).data) as any;
    data.onClosed = listener;
}

export const onClosed = isNodeJS ? node_onClosed : bun_onClosed;

//endregion

//region onMessage

function node_onMessage(socket: WebSocket, listener: ((msg: string|Buffer) => void)): void {
    socket.addEventListener('message', (event) => { listener(event.data) });
}

function bun_onMessage(socket: WebSocket, listener: ((msg: string|Buffer) => void)): void {
    const data = ((socket as any).data) as any;
    data.onMessage = listener;
}

export const onMessage = isNodeJS ? node_onMessage : bun_onMessage;

//endregion

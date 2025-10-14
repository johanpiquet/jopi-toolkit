import {isBunJS, isNodeJS} from "jopi-node-space/ns_what";
import {WebSocket as WsWebSocket} from "ws";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

export function patch_webSocket() {
    if (isNodeJS) {
        NodeSpace.webSocket.openConnection = (wsUrl: string, protocol) => {
            return new Promise<WebSocket>((resolve, reject) => {
                const ws = new WsWebSocket(wsUrl, protocol);
                const ws2 = ws as unknown as WebSocket;

                ws.onopen = () => { resolve(ws2) };
                ws.onerror = () => { reject(); };
            });
        }
    } else if (isBunJS) {
        NodeSpace.webSocket.onClosed = (socket, listener) => {
            const data = ((socket as any).data) as any;
            data.onClosed = listener;
        };

        NodeSpace.webSocket.onMessage = (socket, listener) => {
            const data = ((socket as any).data) as any;
            data.onMessage = listener;
        };
    }
}
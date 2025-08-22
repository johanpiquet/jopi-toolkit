import {isBunJs, isNodeJs} from "./common.ts";
import {WebSocket as WsWebSocket} from "ws";

export function patch_webSocket() {
    if (isNodeJs()) {
        NodeSpace.webSocket.openConnection = (wsUrl: string, protocol) => {
            return new WsWebSocket(wsUrl, protocol) as unknown as WebSocket;
        }
    } else if (isBunJs()) {
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
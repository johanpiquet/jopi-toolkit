import { isBunJs, isNodeJs } from "./common.js";
import { WebSocket as WsWebSocket } from "ws";
export function patch_webSocket() {
    if (isNodeJs()) {
        NodeSpace.webSocket.openConnection = (wsUrl, protocol) => {
            return new Promise((resolve, reject) => {
                const ws = new WsWebSocket(wsUrl, protocol);
                const ws2 = ws;
                ws.onopen = () => { resolve(ws2); };
                ws.onerror = () => { reject(); };
            });
        };
    }
    else if (isBunJs()) {
        NodeSpace.webSocket.onClosed = (socket, listener) => {
            const data = (socket.data);
            data.onClosed = listener;
        };
        NodeSpace.webSocket.onMessage = (socket, listener) => {
            const data = (socket.data);
            data.onMessage = listener;
        };
    }
}
//# sourceMappingURL=_webSocket_s.js.map
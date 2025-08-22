import { isBunJs, isNodeJs } from "./common.js";
import { WebSocket as WsWebSocket } from "ws";
export function patch_webSocket() {
    if (isNodeJs()) {
        NodeSpace.webSocket.openConnection = (wsUrl, protocol) => {
            return new WsWebSocket(wsUrl, protocol);
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
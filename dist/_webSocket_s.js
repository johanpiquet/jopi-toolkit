import { isBunJs } from "./common.js";
export function patch_webSocket() {
    if (isBunJs()) {
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
import {isBunJs} from "./common.ts";

export function patch_webSocket() {
    if (isBunJs()) {
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
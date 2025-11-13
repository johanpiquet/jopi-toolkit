import { WebSocket as WsWebSocket } from "ws";
import { isNodeJS } from "jopi-toolkit/jk_what";
//region openConnection
function node_openConnection(wsUrl, protocol) {
    return new Promise(function (resolve, reject) {
        var ws = new WsWebSocket(wsUrl, protocol);
        var ws2 = ws;
        ws.onopen = function () { resolve(ws2); };
        ws.onerror = function () { reject(); };
    });
}
function bun_openConnection(wsUrl, protocol) {
    return new Promise(function (resolve, reject) {
        var ws = new WebSocket(wsUrl, protocol);
        ws.onopen = function () { resolve(ws); };
        ws.onerror = function () { reject(); };
    });
}
export var openConnection = isNodeJS ? node_openConnection : bun_openConnection;
//endregion
//region onClose
function node_onClosed(socket, listener) {
    socket.addEventListener('close', function () { listener(); });
}
function bun_onClosed(socket, listener) {
    var data = (socket.data);
    data.onClosed = listener;
}
export var onClosed = isNodeJS ? node_onClosed : bun_onClosed;
//endregion
//region onMessage
function node_onMessage(socket, listener) {
    socket.addEventListener('message', function (event) { listener(event.data); });
}
function bun_onMessage(socket, listener) {
    var data = (socket.data);
    data.onMessage = listener;
}
export var onMessage = isNodeJS ? node_onMessage : bun_onMessage;
//endregion

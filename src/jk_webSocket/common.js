export function onError(socket, listener) {
    socket.onerror = listener;
}
export function sendMessage(socket, msg) {
    socket.send(msg);
}

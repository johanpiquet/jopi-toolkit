export function openConnection(wsUrl: string, protocol?: string|string[]): Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(wsUrl, protocol);

        ws.onopen = () => { resolve(ws) };
        ws.onerror = () => { reject(); };
    });
}

export function onClosed(socket: WebSocket, listener: () => void): void {
    socket.addEventListener('close', () => { listener() });
}

export function onMessage(socket: WebSocket, listener: ((msg: string|Buffer) => void)): void {
    socket.addEventListener('message', (event) => { listener(event.data) });
}
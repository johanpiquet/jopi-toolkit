import type {Listener} from "./__global";

let _isBunJs = false;
let _isNodeJs = false;

export async function execListeners(listeners: Listener[]) {
    const list = [...listeners];
    listeners.splice(0);

    for (const listener of list) {
        try {
            const res = listener();
            if (res instanceof Promise) await res;
        }
        catch (e) {
            console.error(e);
        }
    }
}

export function isServerSide(): boolean {
    return isBunJs() || isNodeJs();
}

export function isBunJs(): boolean {
    if (_isBunJs) return _isBunJs;
    return _isBunJs = typeof(Bun)!=="undefined";
}

export function isNodeJs(): boolean {
    if (_isNodeJs) return _isNodeJs;
    return _isNodeJs = typeof(self)==="undefined";
}

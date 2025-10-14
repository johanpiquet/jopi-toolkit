import type {Listener} from "./__global.ts";

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

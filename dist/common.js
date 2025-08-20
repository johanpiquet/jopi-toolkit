let _isBunJs = undefined;
let _isNodeJs = undefined;
export async function execListeners(listeners) {
    const list = [...listeners];
    listeners.splice(0);
    for (const listener of list) {
        try {
            const res = listener();
            if (res instanceof Promise)
                await res;
        }
        catch (e) {
            console.error(e);
        }
    }
}
export function isServerSide() {
    return isBunJs() || isNodeJs();
}
export function isBunJs() {
    if (_isBunJs !== undefined)
        return _isBunJs;
    _isBunJs = typeof (Bun) !== "undefined";
    if (_isBunJs) {
        if (Bun.env["JOPI_FORCE_NODE_JS"]) {
            console.log("JopiNodeSpace: Forcing NodeJs compatibility.");
            _isBunJs = false;
            _isNodeJs = true;
        }
    }
    return _isBunJs;
}
export function isNodeJs() {
    if (_isNodeJs !== undefined)
        return _isNodeJs;
    return _isNodeJs = typeof (self) === "undefined";
}
//# sourceMappingURL=common.js.map
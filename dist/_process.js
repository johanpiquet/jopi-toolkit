export function init_nodeSpaceProcess() {
    NodeSpace.process = {
        isProduction: false,
        argv: [],
        env: {}
    };
    // For bundlers.
    try {
        NodeSpace.process.env = import.meta.env;
        NodeSpace.process.isProduction = (import.meta.env.PROD === "true");
    }
    catch {
    }
}
//# sourceMappingURL=_process.js.map
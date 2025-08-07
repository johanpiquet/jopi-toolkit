export function init_nodeSpaceProcess() {
    NodeSpace.process = {
        isProduction: false,
        argv: [],
        env: {}
    };

    // For bundlers.
    try {
        NodeSpace.process.env = import.meta.env as ({ [key: string]: string });
        NodeSpace.process.isProduction = (import.meta.env.PROD === "true");
    } catch {
    }
}
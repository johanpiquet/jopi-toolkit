export function patch_process() {
    NodeSpace.process = {
        argv: process.argv,
        env: process.env as { [key: string]: string },
        isProduction: process.env.NODE_ENV === 'production'
    };
}
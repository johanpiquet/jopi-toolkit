import { merge } from "./internal.js";
export function patch_process() {
    const myProcess = {
        argv: process.argv,
        env: process.env,
        isProduction: process.env.NODE_ENV === 'production',
    };
    merge(NodeSpace.process, myProcess);
}
//# sourceMappingURL=_process_s.js.map
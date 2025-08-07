import type {ProcessImpl} from "./__global.ts";
import {merge} from "./internal.ts";

export function patch_process() {
    const myProcess: ProcessImpl = {
        argv: process.argv,
        env: process.env as { [key: string]: string },
        isProduction: process.env.NODE_ENV === 'production',
    };

    merge(NodeSpace.process, myProcess);
}
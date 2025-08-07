import type {ProcessImpl} from "./__global.ts";
import {merge} from "./internal.ts";
import {exec} from "node:child_process";

function doExec(command: string) {
    return new Promise<void>((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function patch_process() {
    const myProcess: ProcessImpl = {
        argv: process.argv,
        env: process.env as { [key: string]: string },
        isProduction: process.env.NODE_ENV === 'production',
        exec: doExec
    };

    merge(NodeSpace.process, myProcess);
}
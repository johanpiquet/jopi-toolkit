import type {OsImpl} from "./__global";
import {merge} from "./internal";
import {exec} from "node:child_process";
import {env} from "node:process";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import {isBunJs} from "./common";

async function which(command: string): Promise<string|null> {
    const pathArray = (env.PATH || '').split(process.platform === 'win32' ? ';' : ':');
    const extensions = process.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];

    for (const dir of pathArray) {
        for (const ext of extensions) {
            const fullPath = path.join(dir, command + ext);

            try {
                const stats = await fs.stat(fullPath);
                if (stats.isFile()) return fullPath;
            } catch {
            }
        }
    }

    return null;
}

function doExec(command: string) {
    return new Promise<void>((resolve, reject) => {
        exec(command, (error) => { if (error) reject(error); else resolve() });
    });
}

export function patch_os() {
    const myImpl: OsImpl = {
        exec: doExec,
        which
    };

    if (isBunJs()) {
        //TODO: Bun is sync, can be a problem?
        myImpl.which = (toolName) => Promise.resolve(Bun.which(toolName));
    }

    merge(NodeSpace.os, myImpl);
}
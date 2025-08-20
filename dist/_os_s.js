import { merge } from "./internal.js";
import { exec } from "node:child_process";
import { env } from "node:process";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { isBunJs } from "./common.js";
async function which(command) {
    const pathArray = (env.PATH || '').split(process.platform === 'win32' ? ';' : ':');
    const extensions = process.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];
    for (const dir of pathArray) {
        for (const ext of extensions) {
            const fullPath = path.join(dir, command + ext);
            try {
                const stats = await fs.stat(fullPath);
                if (stats.isFile())
                    return fullPath;
            }
            catch {
            }
        }
    }
    return null;
}
function doExec(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error) => { if (error)
            reject(error);
        else
            resolve(); });
    });
}
export function patch_os() {
    const myImpl = {
        exec: doExec,
        which
    };
    if (isBunJs()) {
        //TODO: Bun is sync, can be a problem?
        myImpl.which = (toolName) => Promise.resolve(Bun.which(toolName));
    }
    merge(NodeSpace.os, myImpl);
}
//# sourceMappingURL=_os_s.js.map
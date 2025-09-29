import type {OsImpl} from "./__global.ts";
import {merge} from "./internal.ts";
import {exec} from "node:child_process";
import {env} from "node:process";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import {isBunJs} from "./common.ts";
import fss from "node:fs";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

async function which(command: string, ifNotFound?: string): Promise<string|null> {
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

    if (ifNotFound) return ifNotFound;
    return null;
}

export function whichSync(cmd: string, ifNotFound?: string): string|null {
    const paths = (process.env.PATH || '').split(path.delimiter);

    if (process.platform === 'win32') {
        const extToTest = process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.EXE', '.CMD', '.BAT'];

        for (const p of paths) {
            for (const ext of extToTest) {
                const full = path.join(p, cmd + ext.toLowerCase());
                if (fss.existsSync(full)) return full;

                const fullUpper = path.join(p, cmd + ext);
                if (fss.existsSync(fullUpper)) return fullUpper;
            }
        }
    } else {
        for (const p of paths) {
            const full = path.join(p, cmd);
            if (fss.existsSync(full)) return full;

            const fullUpper = path.join(p, cmd);
            if (fss.existsSync(fullUpper)) return fullUpper;
        }
    }

    if (ifNotFound) return ifNotFound;
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
        which, whichSync
    };

    if (isBunJs()) {
        //TODO: Bun is sync, can be a problem?
        myImpl.which = (toolName) => Promise.resolve(Bun.which(toolName));
    }

    merge(NodeSpace.os, myImpl);
}
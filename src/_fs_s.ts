import fs from "node:fs/promises";

export function patch_fs() {
    NodeSpace.fs = {
        mkDir: (dirPath: string) => fs.mkdir(dirPath, {recursive: true})
    }
}
import * as jk_fs from "jopi-toolkit/jk_fs";
import {
    addArobaseType,
    addToRegistry,
    createDirSymlink,
    declareError,
    type RegistryItem,
    processThisDirItems
} from "./engine.ts";

export interface ChunkType extends RegistryItem {
    entryPoint: string;
    itemType: string;
}

const arobaseType = addArobaseType("chunks", {
    async processDir(p) {
        let allChildDir = await jk_fs.listDir(p.arobaseDir);

        for (let childDir of allChildDir) {
            if ((childDir.name[0]==='_') || (childDir.name[0]==='.')) continue;

            await processThisDirItems({
                dirToScan: childDir.fullPath,
                dirToScan_expectFsType: "dir",
                childDir_nameConstraint: "mustNotBeUid",

                rootDirName: childDir.name,

                childDir_requireMyUidFile: true,
                childDir_requireRefFile: false,

                childDir_filesToResolve: {
                    "info": ["info.json"],
                    "entryPoint": ["index.tsx", "index.ts"]
                },

                transform: async (props) => {
                    if (!props.resolved?.entryPoint) {
                        throw declareError("No 'index.ts' or 'index.tsx' file found", props.itemPath);
                    }

                    const newItem: ChunkType = {
                        arobaseType: arobaseType,
                        entryPoint: props.resolved.entryPoint,
                        itemType: props.parentDirName,
                        itemPath: props.itemPath,
                    };

                    addToRegistry(props.uid!, newItem);
                }
            });
        }
    },

    async generateCodeForItem(key, rItem, infos) {
        const item = rItem as ChunkType;
        const newFilePath = jk_fs.join(infos.genDir, "chunk", key);
        await createDirSymlink(newFilePath, jk_fs.dirname(item.entryPoint));
    }
});

export default arobaseType;
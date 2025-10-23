import * as jk_fs from "jopi-toolkit/jk_fs";
import chnukArobaseType, {type ChunkType} from "./typeChunks.ts";

import {
    addArobaseType, addToRegistry,
    type TypeRules_ItemDef,
    declareError, genWriteFile, getRegistryItem,
    getSortedDirItem,
    type TransformParams, PriorityLevel, type RegistryItem, requireRegistryItem, applyTypeRulesOnChildDir,
    applyTypeRulesOnDir, mustSkip_expectDir
} from "./engine.ts";

export interface CompositeType extends RegistryItem {
    allDirPath: string[];
    items: CompositePart[];
    itemsType: string;
}

export interface CompositePart {
    ref?: string;
    entryPoint?: string;
    priority: PriorityLevel;
    sortKey: string;
}

const arobaseType = addArobaseType("composites", {
    async processDir(p) {
        let itemTypes = await jk_fs.listDir(p.arobaseDir);

        for (let childDir of itemTypes) {
            if (!childDir.isDirectory || (childDir.name[0] === "_") || (childDir.name[0] === ".")) continue;

            await applyTypeRulesOnDir({
                dirToScan: childDir.fullPath,
                expectFsType: "dir",

                itemDefRules: {
                    nameConstraint: "mustBeUid",
                    requireRefFile: false,
                    requirePriority: false,
                    rootDirName: childDir.name,
                    transform: processComposite
                }
            });
        }
    },

    async generateCodeForItem(key, rItem, infos) {
        function sortByPriority(items: CompositePart[]): CompositePart[] {
            function addPriority(priority: PriorityLevel) {
                let e = byPriority[priority];
                if (e) items.push(...e);
            }

            const byPriority: any = {};

            for (let item of items) {
                if (!byPriority[item.priority]) byPriority[item.priority] = [];
                byPriority[item.priority].push(item);
            }

            items = [];

            addPriority(PriorityLevel.veryHigh);
            addPriority(PriorityLevel.high);
            addPriority(PriorityLevel.default);
            addPriority(PriorityLevel.low);
            addPriority(PriorityLevel.veryLow);

            return items;
        }

        const composite = rItem as CompositeType;
        composite.items = sortByPriority(composite.items);

        let source = "";
        let count = 1;

        let outDir = jk_fs.join(infos.genDir, "composites", composite.itemsType);

        for (let item of composite.items) {
            let entryPoint = item.entryPoint;

            if (!entryPoint) {
                let d = requireRegistryItem<ChunkType>(item.ref!, chnukArobaseType);
                entryPoint = d.entryPoint;
            }

            entryPoint = jk_fs.getRelativePath(outDir, entryPoint);
            source += `import I${count++} from "${entryPoint}";\n`;
        }

        let max = composite.items.length;
        source += "\nexport default [";
        for (let i = 1; i <= max; i++) source += `I${i},`;
        source += "];";

        let fileName = key.substring(key.indexOf("_") + 1) + ".ts";
        await genWriteFile(jk_fs.join(outDir, fileName), source);
    }
});

async function processComposite(p: TransformParams) {
    let compositeId = "composite_" + p.uid!;

    // > Extract the composite items.

    const dirItems = await getSortedDirItem(p.itemPath);
    let compositeItems: CompositePart[] = [];

    const params: TypeRules_ItemDef = {
        rootDirName: p.parentDirName,
        nameConstraint: "mustNotBeUid",
        requirePriority: true,

        filesToResolve: {
            "entryPoint": ["index.tsx", "index.ts"]
        },

        transform: async (item) => {
            if (item.refTarget && item.resolved.entryPoint) {
                throw declareError("The composite can't have both an index file and a .ref file", item.itemPath);
            }

            compositeItems.push({
                priority: item.priority,
                sortKey: item.itemName,
                ref: item.refTarget,
                entryPoint: item.resolved.entryPoint
            });
        }
    };

    for (let dirItem of dirItems) {
        if (await mustSkip_expectDir(dirItem)) continue;
        await applyTypeRulesOnChildDir(params, dirItem);
    }

    // > Add the composite.

    let current = getRegistryItem<CompositeType>(compositeId, arobaseType);

    if (!current) {
        const newItem: CompositeType = {
            arobaseType, itemPath: p.itemPath,
            items: compositeItems, itemsType: p.parentDirName, allDirPath: [p.itemPath]
        };

        addToRegistry(compositeId, newItem);
        return;
    }

    if (current.itemsType !== p.parentDirName) {
        throw declareError(`The composite ${compositeId} is already defined and has a different type: ${current.itemsType}`, p.itemPath);
    }

    current.allDirPath.push(p.itemPath);
    current.items.push(...compositeItems);
}

export default arobaseType;
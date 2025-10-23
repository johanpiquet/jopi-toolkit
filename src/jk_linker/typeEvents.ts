import * as jk_fs from "jopi-toolkit/jk_fs";
import chunkArobaseType, {type ChunkType} from "./typeChunks.ts";

import {
    addArobaseType,
    addToRegistry,
    type ChildDirResolveAndTransformParams,
    declareError,
    type DirTransformParams,
    FilePart,
    genAddToInstallFile,
    genWriteFile,
    getRegistryItem,
    InstallFileType, doesDirItemBeExclude, analizeDirContent, mustSkip_expectDir,
    PriorityLevel,
    type RegistryItem,
    requireRegistryItem,
    resolveAndTransformChildDir, getSortedDirItem
} from "./engine.ts";

export interface EventType extends RegistryItem {
    allDirPath: string[];
    listeners: EventListener[];
    eventName: string;
    conditions?: Set<string>;
}

export interface EventListener {
    ref?: string;
    entryPoint?: string;
    priority: PriorityLevel;
    sortKey: string;
}

let gEvents: Record<string, EventType> = {};

const arobaseType = addArobaseType("events", {
    async processDir(p) {
        let allEventDir = await jk_fs.listDir(p.arobaseDir);

        for (let eventDir of allEventDir) {
            if (await mustSkip_expectDir(eventDir)) continue;

            await resolveAndTransformChildDir({
                childDir_nameConstraint: "mustNotBeUid",
                requireRefFile: false,
                requirePriority: false,
                rootDirName: eventDir.name,

                // Allow conditioning events on "ifServer", "ifBrowser".
                allowConditions: true,

                transform: transformEventListener
            }, eventDir);
        }
    },

    async generateCodeForItem(key, rItem, infos) {
        function sortByPriority(items: EventListener[]): EventListener[] {
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

        const event = rItem as EventType;
        event.listeners = sortByPriority(event.listeners);

        let source = "";
        let count = 1;
        let outDir = jk_fs.join(infos.genDir, "events");

        for (let item of event.listeners) {
            let entryPoint = item.entryPoint;

            if (!entryPoint) {
                let d = requireRegistryItem<ChunkType>(item.ref!, chunkArobaseType);
                entryPoint = d.entryPoint;
            }

            entryPoint = jk_fs.getRelativePath(outDir, entryPoint);
            source += `import E${count++} from "${entryPoint}";\n`;
        }

        source += "\nexport default async function(e: any) {";

        let max = event.listeners.length;

        for (let i = 1; i <= max; i++) {
            source += `\n   let r${i}: any = E${i}(e);`;
            source += `\n   if (r${i} instanceof Promise) await r${i};`;
            source += `\n   if (e.canceled || e.isCatch) return;`
        }

        source += "\n}";

        let fileName = key.substring(key.indexOf("_") + 1) + ".ts";
        await genWriteFile(jk_fs.join(outDir, fileName), source);

        gEvents[event.eventName] = event;
    },

    async endGeneratingCode() {
        function addBrowserHeader() {
            if (isBrowserHeaderAdded) return;
            isBrowserHeaderAdded = true;

            genAddToInstallFile(InstallFileType.browser, FilePart.imports, `import {addListener} from "jopi-toolkit/jk_events";\n`);
        }

        function addServerHeader() {
            if (isServerHeaderAdded) return;
            isServerHeaderAdded = true;

            genAddToInstallFile(InstallFileType.server, FilePart.imports, `import {addListener} from "jopi-toolkit/jk_events";\n`);
        }

        let count = 0;
        let isBrowserHeaderAdded = false;
        let isServerHeaderAdded = false;

        for (let eventName in gEvents) {
            count++;
            let installFileType: InstallFileType;

            let event = gEvents[eventName];
            let conditions = event.conditions;

            if (conditions) {
                console.log("listener conditions:", conditions);

                if (conditions.has("server") && conditions.has("browser")) {
                    installFileType = InstallFileType.both;
                    addBrowserHeader();
                    addServerHeader();
                } else if (conditions.has("server")) {
                    installFileType = InstallFileType.server;
                    addServerHeader();
                } else if (conditions.has("browser")) {
                    installFileType = InstallFileType.browser;
                    addBrowserHeader();
                } else {
                    // Should not happen.
                    installFileType = InstallFileType.both;
                    addBrowserHeader();
                    addBrowserHeader();
                }
            } else {
                installFileType = InstallFileType.both;
                addBrowserHeader();
                addBrowserHeader();
            }

            genAddToInstallFile(installFileType, FilePart.body, `
let E${count}: undefined | ((event: any) => Promise<void>);
addListener("${eventName}", async (e) => {
    if (!E${count}) E${count} = (await import("@/events/${eventName}")).default;       
    await E${count}(e);
});`                        ); // genAddToInstallFile
        }
    }
});

async function transformEventListener(p: DirTransformParams) {
    let eventName = p.parentDirName;

    // > Extract the listener items.

    const params: ChildDirResolveAndTransformParams = {
        rootDirName: eventName,
        childDir_nameConstraint: "mustNotBeUid",
        requirePriority: true,
        childDir_filesToResolve: {
            "entryPoint": ["index.tsx", "index.ts"]
        },

        transform: async (item) => {
            if (item.refFile && item.resolved.entryPoint) {
                throw declareError("The event listener can't have both an index file and a .ref file", item.itemPath);
            }

            listenerItems.push({
                priority: item.priority,
                sortKey: item.itemName,
                ref: item.refFile,
                entryPoint: item.resolved.entryPoint
            });
        }
    };

    const dirItems = await getSortedDirItem(p.itemPath);
    let listenerItems: EventListener[] = [];

    for (let dirItem of dirItems) {
        if (await mustSkip_expectDir(dirItem)) continue;
        if (!dirItem.isDirectory) continue;
        await resolveAndTransformChildDir(params, dirItem);
    }

    // > Add the listener.

    const registryKey = "event_" + eventName;
    let current = getRegistryItem<EventType>(registryKey, arobaseType);

    if (!current) {
        const newItem: EventType = {
            conditions: p.conditions,
            arobaseType, itemPath: p.itemPath,
            listeners: listenerItems, eventName: p.parentDirName, allDirPath: [p.itemPath]
        };

        addToRegistry(registryKey, newItem);
        return;
    } else {
        if (p.conditions) {
            if (current.conditions) {
                for (let c of p.conditions) {
                    current.conditions.add(c);
                }
            } else {
                if (!current.conditions) {
                    current.conditions = p.conditions;
                }
            }
        }
    }

    current.allDirPath.push(p.itemPath);
    current.listeners.push(...listenerItems);
}

export default arobaseType;
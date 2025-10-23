import * as jk_fs from "jopi-toolkit/jk_fs";
import * as jk_tools from "jopi-toolkit/jk_tools";
import * as jk_term from "jopi-toolkit/jk_term";
import * as jk_app from "jopi-toolkit/jk_app";
import * as jk_what from "jopi-toolkit/jk_what";

const LOG = false;

//region Helpers

export async function createDirSymlink(newFilePath: string, targetFilePath: string) {
    await jk_fs.mkDir(jk_fs.dirname(newFilePath));
    await jk_fs.symlink(targetFilePath, newFilePath, "dir");
}

export async function resolve(dirToSearch: string, fileNames: string[]): Promise<string|undefined> {
    for (let fileName of fileNames) {
        let filePath = jk_fs.join(dirToSearch, fileName);
        if (await jk_fs.isFile(filePath)) return filePath;
    }

    return undefined;
}

export function declareError(message: string, filePath?: string): Error {
    jk_term.logBgRed("⚠️ Jopi Linker Error -", message, "⚠️");
    if (filePath) jk_term.logBlue("See:", jk_fs.pathToFileURL(filePath));
    process.exit(1);
}

export function addNameIntoFile(filePath: string, name: string = jk_fs.basename(filePath)) {
    return jk_fs.writeTextToFile(filePath, name);
}

export async function getSortedDirItem(dirPath: string): Promise<jk_fs.DirItem[]> {
    const items = await jk_fs.listDir(dirPath);
    return items.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * This function checks the validity of a directory item
 * and allows to know if we must skip this item.
 */
export async function normalizeDirItem(entry: jk_fs.DirItem, useThisUid?: string | undefined) {
    if (entry.isSymbolicLink) return false;
    if (entry.name[0] === ".") return false;

    if (entry.isDirectory) {
        if (entry.name==="_") {
            let uid = useThisUid || jk_tools.generateUUIDv4();
            let newPath = jk_fs.join(jk_fs.dirname(entry.fullPath), uid);
            await jk_fs.rename(entry.fullPath, newPath);

            entry.name = uid;
            entry.fullPath = newPath;
        }
    }
    // _ allows generating an UID replacing the item.
    //
    else {
        if (entry.name === "_.myuid") {
            let uid = useThisUid || jk_tools.generateUUIDv4();
            await jk_fs.unlink(entry.fullPath);
            entry.fullPath = jk_fs.join(jk_fs.dirname(entry.fullPath), uid + ".myuid");
            entry.name = uid + ".myuid";

            await jk_fs.writeTextToFile(entry.fullPath, uid);
        }
    }

    // Ignore if start by "_".
    return entry.name[0] !== "_";
}

export async function normalizeDirName(item: jk_fs.DirItem) {
    if (!item.isDirectory) return false;

    if (item.name==="_") {
        let uid = jk_tools.generateUUIDv4();
        let newPath = jk_fs.join(jk_fs.dirname(item.fullPath), uid);
        await jk_fs.rename(item.fullPath, newPath);

        item.name = uid;
        item.fullPath = newPath;
    }

    return !((item.name[0] === "_") || (item.name[0] === "."));
}

export function mergeText(...parts: (string|undefined)[]): string {
    return parts.filter(p => p !== undefined).join("");
}

//endregion

//region Registry

export interface RegistryItem {
    itemPath: string;
    arobaseType: ArobaseType;
}

export interface ReplaceItem {
    mustReplace: string;
    replaceWith: string;

    priority: PriorityLevel;
    declarationFile: string;
}

let gRegistry: Record<string, RegistryItem> = {};
let gReplacing: Record<string, ReplaceItem> = {};

export function requireRegistryItem<T extends RegistryItem>(key: string, requireType?: ArobaseType): T {
    const entry = gRegistry[key];
    if (!entry) throw declareError("The item " + key + " is required but not defined");
    if (requireType && (entry.arobaseType !== requireType)) throw declareError("The item " + key + " is not of the expected type @" + requireType.typeName);
    return entry as T;
}

export function getRegistryItem<T extends RegistryItem>(key: string, requireType?: ArobaseType): T|undefined {
    const entry = gRegistry[key];
    if (requireType && entry && (entry.arobaseType !== requireType)) throw declareError("The item " + key + " is not of the expected type @" + requireType.typeName);
    return entry as T;
}

export function addReplace(mustReplace: string, replaceWith: string, priority: PriorityLevel|undefined, declarationFile: string) {
    if (!priority) priority = PriorityLevel.default;
    let current = gReplacing[mustReplace];

    if (current) {
        if (current.priority>priority) return;
    }

    gReplacing[mustReplace] = {declarationFile, mustReplace, replaceWith, priority};

    if (LOG) console.log("Add REPLACE", mustReplace, "=>", replaceWith, "priority", priority);
}

export function addToRegistry<T extends RegistryItem>(uid: string, item: T) {
    if (gRegistry[uid]) declareError("The UID " + uid + " is already defined", gRegistry[uid].itemPath);

    gRegistry[uid] = item;

    if (LOG) {
        const relPath = jk_fs.getRelativePath(gSrcRootDir, item.itemPath);
        console.log(`Add ${uid} to registry. Path: ${relPath}`);
    }
}

//endregion

//region Generating code

export enum FilePart {
    imports = "imports",
    body = "body",
    footer = "footer",
}

export enum InstallFileType {server, browser, both};

let gServerInstallFile: Record<string, string> = {};
let gBrowserInstallFile: Record<string, string> = {};

export async function genWriteFile(filePath: string, fileContent: string): Promise<void> {
    await jk_fs.mkDir(jk_fs.dirname(filePath));
    return jk_fs.writeTextToFile(filePath, fileContent);
}

export function genAddToInstallFile(who: InstallFileType, where: FilePart, text: string) {
    function addTo(group: Record<string, string>) {
        let part = group[where] || "";
        group[where] = part + text;
    }

    if (who===InstallFileType.both) {
        addTo(gServerInstallFile);
        addTo(gBrowserInstallFile);
    } else if (who===InstallFileType.server) {
        addTo(gServerInstallFile);
    } else if (who===InstallFileType.browser) {
        addTo(gBrowserInstallFile);
    }
}

async function generateAll() {
    function applyReplaces() {
        for (let mustReplace in gReplacing) {
            let replaceParams = gReplacing[mustReplace];

            let itemToReplaceRef = gRegistry[mustReplace];
            //
            if (!itemToReplaceRef) {
                let message = "Can't find the UID to replace : " + mustReplace +
                    "\nCheck that the item is declared in a @chunks clause";

                throw declareError(message, replaceParams.declarationFile);
            }

            let replaceWithRef = gRegistry[replaceParams.replaceWith];
            //
            if (!replaceWithRef) {
                throw declareError("Can't find the UID used for replacement : " + replaceParams.replaceWith, replaceParams.declarationFile);
            }

            if (itemToReplaceRef.arobaseType!==replaceWithRef.arobaseType) {
                throw declareError(`Try to replace an element of type ${itemToReplaceRef.arobaseType.typeName} with an element of type ${replaceWithRef.arobaseType.typeName}`, replaceParams.declarationFile);
            }

            gRegistry[mustReplace] = replaceWithRef;
        }
    }

    applyReplaces();

    const infos = {genDir: gGenRootDir};

    for (let arobaseType of Object.values(gArobaseHandler)) {
        if (arobaseType.beginGeneratingCode) {
            await arobaseType.beginGeneratingCode();
        }

        for (let key in gRegistry) {
            const entry = gRegistry[key];
            if (entry.arobaseType === arobaseType) {
                await entry.arobaseType.generateCodeForItem(key, entry, infos);
            }
        }

        if (arobaseType.endGeneratingCode) {
            await arobaseType.endGeneratingCode();
        }
    }

    let installerFile = mergeText(gServerInstallFile[FilePart.imports], gServerInstallFile[FilePart.body], gServerInstallFile[FilePart.footer]);
    await jk_fs.writeTextToFile(jk_fs.join(gGenRootDir, "installServer.ts"), installerFile);
    gServerInstallFile = {};

    installerFile = mergeText(gBrowserInstallFile[FilePart.imports], gBrowserInstallFile[FilePart.body], gBrowserInstallFile[FilePart.footer]);
    await jk_fs.writeTextToFile(jk_fs.join(gGenRootDir, "installBrowser.ts"), installerFile);
    gBrowserInstallFile = {};
}

//endregion

//region Processing dir

export interface ChildDirResolveAndTransformParams {
    rootDirName: string;

    childDir_filesToResolve?: Record<string, string[]>;
    childDir_requireRefFile?: boolean;
    childDir_requireMyUidFile?: boolean;
    childDir_createMissingMyUidFile?: boolean;
    childDir_nameConstraint: "canBeUid"|"mustNotBeUid"|"mustBeUid";
    childDir_allowConditions?: boolean;

    transform: (props: DirTransformParams) => Promise<void>;
}

export interface ProcessThisDirItemsParams extends ChildDirResolveAndTransformParams {
    dirToScan: string;
    dirToScan_expectFsType: "file"|"dir"|"fileOrDir";
}

export interface DirTransformParams {
    itemName: string;
    itemPath: string;
    isFile: boolean;

    uid?: string;
    refFile?: string;
    conditions?: Set<string>;

    parentDirName: string;
    priority: PriorityLevel;

    resolved: Record<string, string|undefined>;
}

export enum PriorityLevel {
    veryLow = -200,
    low = -100,
    default = 0,
    high = 100,
    veryHigh = 200,
}

async function searchPriorityLevel(baseDir: string): Promise<PriorityLevel> {
    function setPriority(level: PriorityLevel) {
        if (priority) throw declareError("More than one priority file declared", baseDir);
        priority = level;
    }

    let priority: PriorityLevel | undefined = undefined;

    let dirItems = await jk_fs.listDir(baseDir);

    for (let entry of dirItems) {
        if (!entry.isFile) continue;
        if (!entry.name.endsWith(".priority")) continue;

        entry.name = entry.name.toLowerCase();
        entry.name = entry.name.replace("-", "");
        entry.name = entry.name.replace("_", "");

        switch (entry.name) {
            case "veryhigh.priority":
                await addNameIntoFile(entry.fullPath);
                setPriority(PriorityLevel.veryHigh);
                break;
            case "high.priority":
                await addNameIntoFile(entry.fullPath);
                setPriority(PriorityLevel.high);
                break;
            case "default.priority":
                await addNameIntoFile(entry.fullPath);
                setPriority(PriorityLevel.default);
                break;
            case "low.priority":
                await addNameIntoFile(entry.fullPath);
                setPriority(PriorityLevel.low);
                break;
            case "verylow.priority":
                await addNameIntoFile(entry.fullPath);
                setPriority(PriorityLevel.veryLow);
                break;
        }
    }

    if (!priority) return PriorityLevel.default;
    return priority;
}

export async function processThisDirItems(p: ProcessThisDirItemsParams) {
    let dirContent = await jk_fs.listDir(p.dirToScan);

    for (let entry of dirContent) {
        if (!await normalizeDirItem(entry)) continue;

        if (p.dirToScan_expectFsType === "file") {
            if (entry.isFile) {
                await resolveAndTransformChildDir(p, entry);
            }
        } else if (p.dirToScan_expectFsType === "dir") {
            if (entry.isDirectory) {
                await resolveAndTransformChildDir(p, entry);
            }
        } else if (p.dirToScan_expectFsType === "fileOrDir") {
            await resolveAndTransformChildDir(p, entry);
        }
    }
}

export async function resolveAndTransformChildDir(p: ChildDirResolveAndTransformParams, dirItem: jk_fs.DirItem) {
    const itemPath = dirItem.fullPath;
    const itemName = dirItem.name;
    const isFile = dirItem.isFile;
    let itemUid: string|undefined;

    // The file / folder-name is a UUID4?
    let isUUID = jk_tools.isUUIDv4(itemName);

    if (isUUID) {
        if (p.childDir_nameConstraint==="mustNotBeUid") {
            throw declareError("The name must NOT be an UID", itemPath);
        }

        itemUid = itemName;
    } else {
        if (p.childDir_nameConstraint==="mustBeUid") {
            throw declareError("The name MUST be an UID", itemPath);
        }
    }

    // It's a file?
    if (isFile) {
        if ((p.childDir_requireMyUidFile===true) && !isUUID) {
            throw declareError("The file name MUST be an UID", itemPath);
        }

        // Process it now.
        await p.transform({
            itemName,
            uid: isUUID ? itemName : undefined,
            priority: PriorityLevel.default,

            itemPath, isFile,
            parentDirName: p.rootDirName,

            resolved: {}
        });

        return;
    }

    // Will search references to config.json / index.tsx / ...
    //
    let resolved: Record<string, string | undefined> = {};
    //
    if (p.childDir_filesToResolve) {
        for (let key in p.childDir_filesToResolve) {
            resolved[key] = await resolve(itemPath, p.childDir_filesToResolve[key]);
        }
    }

    // Search the "uid.myuid" file, which allows knowing the uid of the item.
    //
    const dirItems = await jk_fs.listDir(itemPath);

    //region .myuid file

    let myUidFile: string|undefined;

    // Search the .myuid file.
    // Emit eror if more than one.
    //
    for (let entry of dirItems) {
        if (!await normalizeDirItem(entry, itemUid)) continue

        if (entry.isFile && entry.name.endsWith(".myuid")) {
            if (myUidFile) {
                throw declareError("More than one UID file declared", entry.fullPath);
            }

            myUidFile = jk_fs.basename(entry.name, ".myuid");
            await addNameIntoFile(entry.fullPath);
        }
    }

    // > Not "ui.myuid" found? Then add it if needed.
    //
    if (!myUidFile &&  p.childDir_createMissingMyUidFile && (p.childDir_requireMyUidFile!==false)) {
        if (itemUid) myUidFile = itemUid;
        else myUidFile = jk_tools.generateUUIDv4();
        await jk_fs.writeTextToFile(jk_fs.join(itemPath, myUidFile + ".myuid"), myUidFile);
    }

    // itemUid became myUidFile.
    // If itemUid already defined, then must match myUidFile.
    //
    if (myUidFile) {
        if (itemUid && (itemUid!==myUidFile)) {
            throw declareError("The UID in the .myuid file is NOT the same as the UID in the folder name", itemPath);
        }

        itemUid = myUidFile;
    }

    // Check the rule: must have / must not have a .myuid.
    //
    if (myUidFile) {
        if (p.childDir_requireMyUidFile===false) {
            throw declareError("A .myuid file is found here but NOT EXPECTED", itemPath);
        }
    }
    else {
        if (p.childDir_requireMyUidFile===true) {
            throw declareError("A .myuid file is required", itemPath);
        }
    }

    //endregion

    // region .ref files

    let refFile: string|undefined;
    //
    (await jk_fs.listDir(itemPath)).forEach(entry => {
        if (entry.isFile && entry.name.endsWith(".ref")) {
            if (refFile) throw declareError("More than one .ref file found", itemPath);
            refFile = jk_fs.basename(entry.name, ".ref");

            if (!jk_tools.isUUIDv4(refFile)) {
                throw declareError("The .ref file must be a valid UID", entry.fullPath);
            }

            addNameIntoFile(entry.fullPath);
        }
    });

    if (refFile) {
        if (p.childDir_requireRefFile===false) {
            throw declareError("A .ref file is NOT expected", itemPath);
        }
    } else {
        if (p.childDir_requireRefFile===true) {
            throw declareError("A .ref file is required", itemPath);
        }
    }

    //endregion

    //region .cond files

    let conditions: Set<string>|undefined;
    //
    await Promise.all((await jk_fs.listDir(itemPath)).map(async (entry) => {
        if (!(entry.isFile && entry.name.endsWith(".cond"))) return;

        let condName = jk_fs.basename(entry.name, ".cond").toLowerCase();
        if (condName.startsWith("if")) condName = condName.substring(2);
        condName = condName.replace("-", "");
        condName = condName.replace("_", "");

        if (!conditions) conditions = new Set<string>();
        conditions.add(condName);

        await addNameIntoFile(entry.fullPath, condName + ".cond");
    }));

    if (conditions) {
        if (p.childDir_allowConditions!==true) {
            throw declareError("A .cond file is NOT expected", itemPath);
        }
    }

    //endregion

    //region .priority files

    // File named "defaultPriority", "highPriority", ...
    // allow giving a priority to the rule.
    //
    const priority: PriorityLevel = await searchPriorityLevel(itemPath);

    //endregion

    await p.transform({
        itemName, uid: itemUid, refFile,
        itemPath, isFile, resolved, priority,
        parentDirName: p.rootDirName,
        conditions
    });
}

//endregion

//region Processing project

async function processProject() {
    await jk_fs.rmDir(gGenRootDir);
    await processModules();
    await generateAll();
}

async function processModules() {
    let modules = await jk_fs.listDir(gSrcRootDir);

    for (let module of modules) {
        if (!module.isDirectory) continue;
        if (!module.name.startsWith("mod_")) continue;

        await processModule(module.fullPath);
    }
}

async function processModule(moduleDir: string) {
    let rootDirItem = await jk_fs.listDir(moduleDir);

    for (let dirItem of rootDirItem) {
        if (!dirItem.isDirectory) continue;

        if (dirItem.name[0]==="@") {
            let name = dirItem.name.substring(1);

            let arobaseType = gArobaseHandler[name];
            let params = { moduleDir, arobaseDir: dirItem.fullPath, genDir: gGenRootDir };
            if (arobaseType) await arobaseType.processDir(params);
        }
    }
}

//endregion

//region Extensions

export type ArobaseDirScanner = (infos: { moduleDir: string; arobaseDir: string; genDir: string; }) => Promise<void>;
export type ArobaseItemProcessor = (key: string, item: RegistryItem, infos: { genDir: string; }) => Promise<void>;

export interface ArobaseType {
    typeName: string;
    processDir: ArobaseDirScanner;
    generateCodeForItem: ArobaseItemProcessor;
    beginGeneratingCode?: () => Promise<void>;
    endGeneratingCode?: () => Promise<void>;
}

let gArobaseHandler: Record<string, ArobaseType> = {};

export function addArobaseType(name: string, type: Omit<ArobaseType, "typeName">) {
    if (name.startsWith("@")) name = name.substring(1);
    return gArobaseHandler[name] = {...type, typeName: name};
}

//endregion

//region Bootstrap

let gProjectRootDir: string;
let gGenRootDir: string;
let gSrcRootDir: string;

export function getProjectGenDir() {
    return gGenRootDir;
}

export async function compile(rootDir: string = jk_app.findPackageJsonDir()) {
    async function searchLinkerScript(): Promise<string|undefined> {
        let jopiLinkerScript = jk_fs.join(gProjectRootDir, "dist", "jopi-linker.js");
        if (await jk_fs.isFile(jopiLinkerScript)) return jopiLinkerScript;

        if (jk_what.isBunJS) {
            jopiLinkerScript = jk_fs.join(gSrcRootDir, "jopi-linker.ts");
            if (await jk_fs.isFile(jopiLinkerScript)) return jopiLinkerScript;
        }

        return undefined;
    }

    gProjectRootDir = rootDir;
    gSrcRootDir = jk_fs.join(gProjectRootDir, "src");
    gGenRootDir = jk_fs.join(gSrcRootDir, "_jopiLinkerGen");

    let jopiLinkerScript = await searchLinkerScript();
    if (jopiLinkerScript) await import(jopiLinkerScript);

    await processProject();
}

//endregion
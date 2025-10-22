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

export function addNameIntoFile(filePath: string) {
    return jk_fs.writeTextToFile(filePath, jk_fs.basename(filePath));
}

export async function getSortedDirItem(dirPath: string): Promise<jk_fs.DirItem[]> {
    const items = await jk_fs.listDir(dirPath);
    return items.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * This function checks the validity of a directory item
 * and allows to know if we must skip this item.
 */
export async function checkDirItem(entry: jk_fs.DirItem) {
    if (entry.isSymbolicLink) return false;
    if (entry.name[0] === ".") return false;

    // _ allows generating an UID replacing the item.
    //
    if (entry.name === "_.myuid") {
        let uid = jk_tools.generateUUIDv4();
        await jk_fs.unlink(entry.fullPath);
        entry.fullPath = jk_fs.join(jk_fs.dirname(entry.fullPath), uid + ".myuid");
        entry.name = uid + ".myuid";

        await jk_fs.writeTextToFile(entry.fullPath, uid);
    }

    // Ignore if start by "_".
    return entry.name[0] !== "_";
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

let gInstallFile_imports = "";
let gInstallFile_body = "";
let gInstallFile_footer = "";

export async function genWriteFile(filePath: string, fileContent: string): Promise<void> {
    await jk_fs.mkDir(jk_fs.dirname(filePath));
    return jk_fs.writeTextToFile(filePath, fileContent);
}

export function genAddToInstaller_imports(text: string) {
    gInstallFile_imports += text;
}

export function genAddToInstaller_body(text: string) {
    gInstallFile_body += text;
}

export function genAddToInstaller_footer(text: string) {
    gInstallFile_footer += text;
}

async function generateAll() {
    function applyReplaces() {
        for (let mustReplace in gReplacing) {
            let replaceParams = gReplacing[mustReplace];

            let itemToReplaceRef = gRegistry[mustReplace];
            //
            if (!itemToReplaceRef) {
                let message = "Can't find the UID to replace : " + mustReplace +
                    "\nCheck that the item is declared in a @defines clause";

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

    let installerFile = gInstallFile_imports;
    installerFile += gInstallFile_body;
    installerFile += gInstallFile_footer;

    await jk_fs.writeTextToFile(jk_fs.join(gGenRootDir, "install.ts"), installerFile);

    // > Clean the resources

    gInstallFile_imports = "";
    gInstallFile_body = "";
    gInstallFile_footer = "";

    gRegistry = {};
    gReplacing = {};
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
        if ((entry.name[0] === ".")||(entry.name[0] === "_")) return false;

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

    // The file / folder-name is a UUID4?
    let isUUID = jk_tools.isUUIDv4(itemName);

    if (isUUID) {
        if (p.childDir_nameConstraint==="mustNotBeUid") {
            throw declareError("The name must NOT be an UID", itemPath);
        }
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

    let itemUid: string|undefined;

    // Search the "uid.myuid" file, which allows knowing the uid of the item.
    //
    const dirItems = await jk_fs.listDir(itemPath);
    //
    for (let entry of dirItems) {
        if (!await checkDirItem(entry)) continue

        if (entry.isFile && entry.name.endsWith(".myuid")) {
            if (itemUid) {
                throw declareError("More than one UID file declared", entry.fullPath);
            }

            itemUid = jk_fs.basename(entry.name, ".myuid");
            addNameIntoFile(entry.fullPath);
        }
    }

    if (!itemUid) {
        // > Not "ui.myuid" found? Then add it.

        if (p.childDir_createMissingMyUidFile) {
            itemUid = jk_tools.generateUUIDv4();
            await jk_fs.writeTextToFile(jk_fs.join(itemPath, itemUid + ".myuid"), itemUid);
        }
    }

    // Search the ref file.
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

    // File named "defaultPriority", "highPriority", ...
    // allow giving a priority to the rule.
    //
    const priority: PriorityLevel = await searchPriorityLevel(itemPath);

    if (itemUid) {
        if (p.childDir_requireMyUidFile===false) {
            throw declareError("A .myuid file is found here but NOT EXPECTED", itemPath);
        }
    }
    else {
        if (p.childDir_requireMyUidFile===true) {
            throw declareError("A .myuid file is required", itemPath);
        }
    }

    await p.transform({
        itemName, uid: itemUid, refFile,
        itemPath, isFile, resolved, priority,
        parentDirName: p.rootDirName
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
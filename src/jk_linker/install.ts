import * as jk_fs from "jopi-toolkit/jk_fs";
import {Registry, globalRegistry} from "jopi-toolkit/jk_registry";
import {compile, getProjectGenDir} from "./engine.ts";
import * as jk_app from "jopi-toolkit/jk_app";

export async function loadServerInstall(registry: Registry = globalRegistry): Promise<Registry> {
    let genDir = getProjectGenDir();
    let installFilePath = jk_fs.join(genDir, "installServer.ts");
    if (!await jk_fs.isFile(installFilePath)) return registry;

    installFilePath = jk_app.getCompiledFilePathFor(installFilePath);
    if (!installFilePath) return registry;

    let v = await import(installFilePath);
    if (!v.default) return registry;

    await v.default(registry);
    return registry;
}

export type InstallFunction = (registry: Registry) => void;

export async function getBrowserInstallFunction(): Promise<InstallFunction> {
    let installFilePath = getBrowserInstallScript();
    if (!await jk_fs.isFile(installFilePath)) return gVoidFunction;

    installFilePath = jk_app.getCompiledFilePathFor(installFilePath);
    if (!installFilePath) return gVoidFunction;

    let v = await import(installFilePath);
    if (!v.default) return gVoidFunction;

    return function(registry: Registry) {
        v.default(registry);
    }
}

export function getBrowserInstallScript(): string {
    let genDir = getProjectGenDir();
    return jk_fs.join(genDir, "installBrowser.ts");
}

const gVoidFunction = () => {};
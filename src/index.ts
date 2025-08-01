import {isBunJs, isNodeJs, isServerSide, type ServerType} from "./common.ts";

export * from "./common.ts";

import {initBrowser} from "./browser.ts";

// Will init with the common stuffs.
initBrowser();

if (isServerSide()) {
    let serverType: ServerType = "nodejs";
    if (isBunJs()) serverType = "bunjs";

    // Allow conditional code to be ok
    // despite the "await import" is not done yet.
    //
    const nodeSpace = globalThis.NodeSpace;

    nodeSpace.what = {
        isNodeJS: isNodeJs(),
        isBunJs: isBunJs(),
        isBrowser: false,
        isServerSide: true,
        serverType: serverType,
    }

    let ext = import.meta.filename.split(".").pop();
    const fileName = "./serverSide." + ext;

    // To know: the caller will not wait for the await to resolve.
    // Wait is after will not be interpreted immediately by the caller
    // doing that specifics server-side things will not be ok now.
    //
    await import(/* @vite-ignore */ fileName);
}
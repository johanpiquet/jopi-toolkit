import {isServerSide} from "./common.ts";
export * from "./__global.ts";

import {initBrowser} from "./browser.ts";

// Will init with the common stuffs.
initBrowser();

if (isServerSide()) {
    //let ext = import.meta.filename.split(".").pop();
    //const fileName = "./serverSide." + ext;

    // Is synchronous, it's why we use "require" here instead of "import".
    require(/* @vite-ignore */ "./serverSide.js");
}

export default NodeSpace;
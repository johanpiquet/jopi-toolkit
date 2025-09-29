import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

export function init_nodeSpaceWhat() {
    NodeSpace.what = {
        isNodeJS: false,
        isBunJs: false,
        isServerSide: false,
        isBrowser: true,
        serverType: "browser",
    };
}
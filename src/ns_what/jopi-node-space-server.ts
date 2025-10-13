export const isNodeJS = typeof(Bun)==="undefined";
export const isBunJs = typeof(Bun)!=="undefined";
export const isServerSide = true;
export const isBrowser = false;
export const serverType = isNodeJS ? "node" : "bun";
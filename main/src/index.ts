import {isNodeJs, isServerSide} from "./common.ts";
export * from "./__global.ts";
import {initBrowser} from "./browser.ts";

// Will be ignored by Vite.js (see comment at end of this file).
import NodeModule from 'node:module';

// Will init with the common stuffs.
initBrowser();

if (isServerSide()) {
    if (isNodeJs()) {
        const myMeta = import.meta;
        const dirname = myMeta.dirname;

        //@vite-ignore
       const require = NodeModule.createRequire(dirname);

        let filePath = dirname + "/serverSide.js";
        require(/* @vite-ignore */ filePath);
    } else {
        require(/* @vite-ignore */ "./serverSide.js");
    }
}

export default NodeSpace;

/*
*** With Vite.js ***

You will have to use the following code vite.config.js.
The goal is to ignore the "import { createRequire } from 'node:module';"

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { external: ['node:module'] } },
  ssr: { noExternal: ['node:module'] },
});

*/
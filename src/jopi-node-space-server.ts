import {patch_compress} from "./_compress_s.ts";
import {patch_stream} from "./_stream_s.ts";
import {patch_webSocket} from "./_webSocket_s.ts";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

patch_stream();
patch_compress();
patch_webSocket();

NodeSpace.app.declareServerSideReady();

// When the program exits gracefully
process.on('exit', () => NodeSpace.app.declareAppExiting());

// When the user wants to terminate the program (CTRL+C)
process.on('SIGINT', () => NodeSpace.app.declareAppExiting());

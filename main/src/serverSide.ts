import {patch_process} from "./_process_s";
import {patch_thread} from "./_thread_s";
import {patch_fs} from "./_fs_s";

patch_process();
patch_thread();
patch_fs();

NodeSpace.app.declareServerSideReady();
process.on('exit', () => NodeSpace.app.declareAppExiting());
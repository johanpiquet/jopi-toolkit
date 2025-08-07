import {patch_process} from "./_process_s";
import {patch_thread} from "./_thread_s";
import {patch_fs} from "./_fs_s";
import {patch_crypto} from "./_crypto_s";

patch_process();
patch_thread();
patch_fs();
patch_crypto();

NodeSpace.app.declareServerSideReady();
process.on('exit', () => NodeSpace.app.declareAppExiting());
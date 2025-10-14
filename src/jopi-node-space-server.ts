import {patch_compress} from "./_compress_s.ts";
import {patch_stream} from "./_stream_s.ts";
import {patch_webSocket} from "./_webSocket_s.ts";

patch_stream();
patch_compress();
patch_webSocket();
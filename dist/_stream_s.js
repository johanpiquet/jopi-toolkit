import { isBunJs } from "./common.js";
import { merge } from "./internal.js";
async function teeResponse(response) {
    // Actually response.body.tee is ko with node.js, we can't use it.
    const bodyArrayBuffer = await response.arrayBuffer();
    let headers = new Headers(response.headers);
    // Sometimes the content length becomes invalid, it's why we need to update it.
    headers.set("content-length", bodyArrayBuffer.byteLength.toString());
    // TODO: is it possible to avoid loading in memory?
    const blob1 = new Blob([bodyArrayBuffer]);
    const blob2 = new Blob([bodyArrayBuffer]);
    response = new Response(blob2.stream(), { status: response.status, headers });
    return [blob1.stream(), response];
}
export function patch_stream() {
    const myStream = {
        teeResponse
    };
    if (isBunJs()) {
        myStream.teeResponse = r => {
            const [b1, b2] = r.body.tee();
            // The old response body is consumed. So we must rebuild the response.
            return Promise.resolve([b1, new Response(b2, { status: r.status, headers: r.headers })]);
        };
    }
    merge(NodeSpace.stream, myStream);
}
//# sourceMappingURL=_stream_s.js.map
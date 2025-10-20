export function teeResponse(r: Response): Promise<[ReadableStream, Response]> {
    const [b1, b2] = r.body!.tee();

    // The old response body is consumed. So we must rebuild the response.
    return Promise.resolve([b1, new Response(b2, {status: r.status, headers: r.headers})]);
}
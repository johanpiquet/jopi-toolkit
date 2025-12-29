import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export * from "./common.ts";
import * as jk_timer from "jopi-toolkit/jk_timer";

import { exec } from 'child_process';
import os from 'os';

export interface GithubDownloadParams {
    /**
     * The file or directory to download.
     * Must be of type: https://github.com/ownerName/repoName/tree/branchName/path/to/folder
     */
    url: string;

    /**
     * Where to save the files.
     * If downloading a directory: download the directory inside this folder.
     * If downloading a file: this path is the name of the downloaded file.
     */
    downloadPath: string;

    /**
     * If true, then log the download progress.
     */
    log?: boolean;
}

/**
 * Download a file or a directory from a GitHub repository.
 */
export async function githubDownload(params: GithubDownloadParams) {
    async function downloadFile(localPath: string, contentUrl: string): Promise<void> {
        const localDir = path.dirname(localPath);
        const headers: HeadersInit = {};

        await fs.mkdir(localDir, { recursive: true });

        const response = await fetch(contentUrl, { headers: headers, });

        if (!response.ok) {
            throw new Error(`Github download error: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        await fs.writeFile(localPath, Buffer.from(buffer));

        if (params.log) console.log("Downloaded", contentUrl)
    }

    async function fetchAndProcessContent(currentPath: string, downloadRoot: string): Promise<void> {
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${currentPath}?ref=${branchName}`;
        const headers: HeadersInit = {};

        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
            throw new Error(`Github download error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const isFile = !Array.isArray(data) && (data.type === 'file');

        if (isFile && isFirst) {
            await downloadFile(downloadRoot, data.download_url);
            return;
        }

        const contents: any[] = Array.isArray(data) ? data : [data];
        isFirst = false;

        for (const item of contents) {
            // Reduce, otherwise we get a "403 rate limit exceed" error.
            await jk_timer.tick(50);

            if (item.type === 'file' && item.download_url) {
                let itemPath = item.path;
                itemPath = itemPath.substring(pathInsideRepo.length + 1);
                await downloadFile(path.join(downloadRoot, itemPath), item.download_url);
            } else if (item.type === 'dir') {
                await fetchAndProcessContent(item.path, downloadRoot);
            }
        }
    }

    let isFirst = true;

    let url = params.url;
    if (!url.startsWith("https://github.com/")) throw new Error("Invalid URL - Must be of type https://github.com/ownerName/repoName/tree/branchName/path/to/folder");

    url = url.substring("https://github.com/".length);
    let parts = url.split("/").reverse();

    let repoOwner = parts.pop();
    let repoName = parts.pop();
    let tree = parts.pop();
    if (tree !== "tree") throw new Error("Invalid URL - Must be of type https://github.com/ownerName/repoName/tree/branchName/path/to/folder");
    let branchName = parts.pop();
    const pathInsideRepo = parts.reverse().join("/");

    await fetchAndProcessContent(pathInsideRepo, params.downloadPath);
}


export function killPort(port: string = '3000'): Promise<void> {
    return new Promise<void>((resolve) => {
        const isWindows = os.platform() === 'win32';

        // On Windows, we use netstat to find the PID of the process using the port as LOCAL address.
        // On Unix, we use lsof with -sTCP:LISTEN to only get the listening process (avoiding killing clients/browsers).
        const command = isWindows
            ? `netstat -ano | findstr :${port}`
            : `lsof -ti :${port} -sTCP:LISTEN`;

        exec(command, (_error, stdout) => {
            if (!stdout) {
                resolve();
                return;
            }

            const pids = isWindows
                ? [...new Set(stdout.trim().split('\n').map(line => {
                    const parts = line.trim().split(/\s+/);
                    // netstat -ano output: Proto, Local Address, Foreign Address, State, PID
                    const localAddress = parts[1] || "";
                    const pid = parts[parts.length - 1];
                    // Check if it's exactly the port (avoiding :3000 matching :30000)
                    // and ensure it's the local address (avoiding killing clients connected to this port)
                    if (localAddress.endsWith(`:${port}`)) {
                        return pid;
                    }
                    return null;
                }).filter((pid): pid is string => !!(pid && /^\d+$/.test(pid) && pid !== '0')))]
                : stdout.trim().split('\n').filter(pid => pid && /^\d+$/.test(pid));

            const killCmd = isWindows ? 'taskkill /PID' : 'kill -9';
            let pending = pids.length;

            if (pending === 0) {
                resolve();
                return;
            }

            pids.forEach(pid => {
                exec(`${killCmd} ${pid}${isWindows ? ' /F' : ''}`, async (err) => {
                    if (err) {
                        // Process might have already exited
                    } else {
                        console.log(`⚠️  Process ${pid} automatically killed to free the port ${port}`);
                    }

                    if (--pending === 0) {
                        await jk_timer.tick(250);
                        resolve();
                    }
                });
            });
        });
    });
}

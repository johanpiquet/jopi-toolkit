export async function which(command: string, ifNotFound?: string): Promise<string|null> {
    if (ifNotFound) return Promise.resolve(ifNotFound);
    return Promise.resolve(null);
}

export function whichSync(cmd: string, ifNotFound?: string): string|null {
    if (ifNotFound) return ifNotFound;
    return null;
}

export function exec(command: string): Promise<void> {
    return Promise.resolve();
}
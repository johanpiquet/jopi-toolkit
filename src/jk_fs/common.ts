export interface DirItem {
    name: string;
    fullPath: string;

    isFile: boolean;
    isDirectory: boolean;
    isSymbolicLink: boolean;
}

export interface FileState {
    size: number,

    mtimeMs: number,
    ctimeMs: number,
    birthtimeMs: number,

    isDirectory: () => boolean,
    isFile: () => boolean,
    isSymbolicLink: () => boolean,
}
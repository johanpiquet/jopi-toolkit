import { z } from "zod";
import {generateUUIDv4} from "./ns_tools.ts";

export function intPositive(title: string, description?: string) {
    return z.number().int().positive().meta({title, description});
}

export function string(title: string, description?: string) {
    return z.string().meta({title, description});
}

export type output<T> = T extends { _zod: { output: any } } ? T["_zod"]["output"] : unknown;
export type { output as infer };

export const schema = z.object;
export const toJson = z.toJSONSchema;

export type Schema = z.ZodSchema<any>;

export function registerSchema(name: string|undefined, schema: Schema) {
    if (!name) {
        throw new Error("🥰 ns_schemas - You need an uid for your schema: " + generateUUIDv4() + " 🥰");
    }

    gRegistry[name!] = schema;
}

export function getSchema(name: string): Schema|undefined {
    return gRegistry[name];
}

export function requireSchema(name: string): Schema {
    const s = getSchema(name);

    if (!s) {
        throw new Error(`Zod schema ${name} not found`);
    }

    return s;
}

const gRegistry: Record<string, z.ZodSchema<any>> = {};
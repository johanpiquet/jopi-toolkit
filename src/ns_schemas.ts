import { z } from "zod";
import {generateUUIDv4} from "./ns_tools.ts";

export function intPositive(title: string, description?: string) {
    return z.number().int().positive().meta({title, description});
}

export function string(title: string, description?: string) {
    return z.string().meta({title, description});
}

export function boolean(title: string, description?: string) {
    return z.boolean().meta({title, description});
}

export type output<T> = T extends { _zod: { output: any } } ? T["_zod"]["output"] : unknown;
export type { output as infer };

export const schema = z.object;
export const toJson = z.toJSONSchema;

export type Schema = z.ZodSchema<any>;

export interface SchemaMeta {
    title: string;
    description?: string;

    [k:string]:any;
}

interface RegistryEntry {
    schema: Schema;
    meta?: SchemaMeta;
}

export function registerSchema(name: string|undefined, schema: Schema, meta?: SchemaMeta) {
    if (!name) {
        throw new Error("🥰 ns_schemas - You need an uid for your schema: " + generateUUIDv4() + " 🥰");
    }

    gRegistry[name!] = {schema, meta};
}

export function getSchemaMeta(schemaId: string): SchemaMeta|undefined {
    const entry = gRegistry[schemaId];
    if (entry) return entry.meta;
    return undefined;
}

export function getSchema(schemaId: string): Schema|undefined {
    const entry = gRegistry[schemaId];
    if (entry) return entry.schema;
    return undefined;
}

export function requireSchema(schemaId: string): Schema {
    const s = getSchema(schemaId);

    if (!s) {
        throw new Error(`ns_schemas - Schema ${schemaId} not found`);
    }

    return s;
}

const gRegistry: Record<string, RegistryEntry> = {};
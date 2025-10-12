import { z } from "zod";
import {generateUUIDv4} from "./ns_tools.ts";

export type ErrorMessage = string;

export interface FieldValueValidator {
    check: (value: any) => boolean;
    errorMessage: string;
}

export interface FieldInfosBase<T> {
    description?: string;
    default?: T;
    optional?: boolean;

    errorMessage_isRequired?: string;
    errorMessage_theDataTypeIsInvalid?: string;
    errorMessage_theValueIsInvalid?: string;

    normalize?: (value: T) => T;
    validator?: FieldValueValidator[];
}

export interface FieldInfos_String extends FieldInfosBase<string> {
    minLength?: number;
    errorMessage_minLength?: ErrorMessage;

    maxLength?: number;
    errorMessage_maxLength?: ErrorMessage;
}

export interface FieldInfos_Integer extends FieldInfosBase<number> {
    minValue?: number;
    maxValue?: number;
}

type FieldType<T extends z.core.SomeType> =  T|z.ZodDefault<T>|z.ZodOptional<T>|z.ZodOptional<z.ZodDefault<T>>;

export function string(title: string, infos?: FieldInfos_String): z.ZodString {
    if (!infos) infos = {};
    const meta = {title, description: infos.description};

    let field: FieldType<z.ZodString> = z.string().meta(meta);

    if (infos.minLength!==undefined) {
        field = field.min(infos.minLength,
            {error: infos.errorMessage_minLength||infos.errorMessage_theValueIsInvalid});
    } else if (!infos.optional) {
        field = field.nonempty({error: infos.errorMessage_isRequired});
    }

    if (infos.maxLength!==undefined) {
        field = field.max(infos.maxLength,
            {error: infos.errorMessage_maxLength||infos.errorMessage_theValueIsInvalid});
    }

    if (infos.default!==undefined) {
        field = field.default(infos.default);
    }

    if (infos.optional) {
        field = field.optional();
    }

    if (infos.validator) {
        for (const v of infos.validator) {
            field = field.refine(v.check, v.errorMessage);
        }
    }

    if (infos.normalize) {
        return z.preprocess(infos.normalize, field) as unknown as z.ZodString;
    }

    return field as unknown as z.ZodString;
}

/*export function number(title: string, infos) {
    return z.number().int().positive().meta({title, description});
}

export function boolean(title: string, description?: string) {
    return z.boolean().meta({title, description});
}*/

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
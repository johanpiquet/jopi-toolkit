import {generateUUIDv4} from "jopi-node-space/ns_tools";

//region Validation

/**
 * Throwing this error allows it to be caught
 * when validating an object.
 */
class SchemaError extends Error {
}

/**
 * Declare an error when validating a schema.
 * Must be called when validating or normalizing.
 */
export function declareError(message: string) {
    throw new SchemaError(message);
}

//endregion

//region Registry

interface RegistryEntry {
    schema: Schema;
    meta?: any;
}

export function registerSchema(schemaId: string|undefined, schema: Schema, meta?: any) {
    if (!schemaId) {
        throw new Error("ns_schemas - Schema id required. If you need an uid you can use: " + generateUUIDv4());
    }

    gRegistry[schemaId!] = {schema, meta};
}

export function getSchemaMeta(schemaId: string): Schema|undefined {
    const entry = gRegistry[schemaId];
    if (entry) return entry.schema;
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

//endregion

//region Schema

export interface Schema {
    [field: string]: ScField<any, any>;
}

/**
 * Allow getting a valid TypeScript type for our schema.
 *
 * **Example**
 * ```
 * const UserSchema = { name: string("The name", false), test: string("Test", true) };
 * type UserDataType = SchemaToType<typeof UserSchema>;
 * let ud: UserDataType = {name:"ok", test: "5"};
 * ```
 */
export type SchemaToType<S extends Schema> =
    { [K in keyof S as S[K] extends ScField<any, false> ? K : never]: S[K] extends ScField<infer T, any> ? T : never }
    & { [K in keyof S as S[K] extends ScField<any, true> ? K : never] ?: S[K] extends ScField<infer T, any> ? T : never };

export interface ScField<T, Opt extends boolean> {
    title: string;
    description?: string;
    default?: T;
    optional?: Opt;

    errorMessage_isRequired?: string;
    errorMessage_theDataTypeIsInvalid?: string;
    errorMessage_theValueIsInvalid?: string;

    normalize?: (value: T) => T;
    validator?: (value: T) => void;

    metas?: Record<string, string>;
}

type WithoutTitleOptional<T> = Omit<Omit<T, "title">, "optional">;

//endregion

//region Common types

//region String

export interface ScString<Opt extends boolean> extends ScField<string, Opt> {
    minLength?: number;
    errorMessage_minLength?: string;

    maxLength?: number;
    errorMessage_maxLength?: string;
}

export function string<Opt extends boolean>(title: string, optional: Opt, infos?: WithoutTitleOptional<ScString<Opt>>): ScString<Opt> {
    return {...infos, title, optional};
}

//endregion

//region Boolean

export interface ScBoolean<Opt extends boolean> extends ScField<boolean, Opt> {
}

export function boolean<Opt extends boolean>(title: string, optional: Opt, infos?: WithoutTitleOptional<ScBoolean<Opt>>): ScBoolean<Opt> {
    return {...infos, title, optional};
}

//endregion

//region Number

export interface ScNumber<Opt extends boolean> extends ScField<number, Opt> {
}

export function number<Opt extends boolean>(title: string, optional: Opt, infos?: WithoutTitleOptional<ScNumber<Opt>>): ScNumber<Opt> {
    return {...infos, title, optional};
}

//endregion

//endregion

const UserSchema = {
    name: string("The name", false),
    test: string("Test", true),
    yesTrue: boolean("Accept", true),
    age: number("Age", true),
};

type UserDataType = SchemaToType<typeof UserSchema>;
let ud: UserDataType = {name:"ok", test: "5"};
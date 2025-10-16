// noinspection JSUnusedGlobalSymbols

import {generateUUIDv4} from "jopi-node-space/ns_tools";

//region Validation

/**
 * Throwing this error allows it to be caught
 * when validating an object.
 */
class SchemaError extends Error {
    constructor(message: string, public readonly errorCode?: string) {
        super(message);
    }
}

/**
 * Declare an error when validating a schema.
 * Must be called when validating or normalizing.
 */
export function declareError(message: string, errorCode?: string) {
    throw new SchemaError(message, errorCode);
}

interface FieldError {
    fieldName: string;
    message: string;
    code?: string;
}

interface ValidationErrors {
    /**
     * An error about the whole schema.
     */
    globalError?: string;
    globalErrorCode?: string;

    /**
     * An error per field.
     */
    fields?: Record<string, FieldError>;
}

export function validateSchema(value: any, schema: Schema): ValidationErrors|undefined {
    //TODO
    return undefined;
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

export function schema<T extends SchemaDescriptor>(descriptor: T): T {
    return descriptor;
}

export interface SchemaDescriptor  {
    [field: string]: ScField<any, any>;
}

export interface Schema extends SchemaDescriptor {
}

export function toJson(schema: Schema): SchemaDescriptor {
    return schema;
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
    type: string;

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

export type SchemaFieldInfos = ScField<any, any>;

type OnlyInfos<T> = Omit<Omit<Omit<T, "title">, "optional">, "type">;

//endregion

//region Common types

//region String

export interface ScString<Opt extends boolean> extends ScField<string, Opt> {
    minLength?: number;
    errorMessage_minLength?: string;

    maxLength?: number;
    errorMessage_maxLength?: string;
}

export function string<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScString<Opt>>): ScString<Opt> {
    return {...infos, title, optional, type: "string"};
}

//endregion

//region Boolean

export interface ScBoolean<Opt extends boolean> extends ScField<boolean, Opt> {
}

export function boolean<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScBoolean<Opt>>): ScBoolean<Opt> {
    return {...infos, title, optional, type: "boolean"};
}

//endregion

//region Number

export interface ScNumber<Opt extends boolean> extends ScField<number, Opt> {
}

export function number<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScNumber<Opt>>): ScNumber<Opt> {
    return {...infos, title, optional, type: "number"};
}

//endregion

//endregion

/*const UserSchema1 = {
    name: string("The name", false),
    test: string("Test", false),
    yesTrue: boolean("Accept", false),
    age: number("Age", false),
};

const UserSchema2 = schema({
    name: string("The name", false),
    test: string("Test", false),
    yesTrue: boolean("Accept", false),
    age: number("Age", false),
});

type UserDataType1 = SchemaToType<typeof UserSchema1>;
let ud1: UserDataType1 = {name:"ok"};

type UserDataType2 = SchemaToType<typeof UserSchema2>;
let ud2: UserDataType2 = {name:"ok"};*/
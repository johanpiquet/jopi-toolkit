// noinspection JSUnusedGlobalSymbols

import {generateUUIDv4} from "jopi-node-space/ns_tools";

//region Validation

/**
 * Throwing this error allows it to be caught
 * when validating an object.
 */
class SchemaError extends Error {
    constructor(public readonly errorMessage?: string, public readonly errorCode?: string) {
        super("");
    }
}

/**
 * Declare an error when validating a schema.
 * Must be called when validating or normalizing.
 */
export function declareError(message?: string, errorCode?: string) {
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

const byTypeValidator: Record<string, (v: any, fieldInfos: SchemaFieldInfos) => void> = {
    "string": (v, f) => {
        if (typeof v !== "string") {
            declareError(f.errorMessage_theValueIsInvalid || `Value must be a string`, "INVALID_TYPE");
            return;
        }

        let sf = f as ScString<any>;

        if ((sf.minLength!==undefined) && (v.length < sf.minLength)) {
            declareError(sf.errorMessage_minLength || `Value must be at least ${sf.minLength} characters long`, "INVALID_LENGTH");
            return;
        }

        if ((sf.maxLength!==undefined) && (v.length > sf.maxLength)) {
            declareError(sf.errorMessage_maxLength || `Value must be less than ${sf.maxLength} characters long`, "INVALID_LENGTH");
            return;
        }
    },

    "number": (v, f) => {
        if (typeof v !== "number") {
            declareError(f.errorMessage_theValueIsInvalid || `Value must be a number`, "INVALID_TYPE");
        }

        let sf = f as ScNumber<any>;

        if ((sf.minValue!==undefined) && (v < sf.minValue)) {
            declareError(sf.errorMessage_minValue || `Value must be at least ${sf.minValue}`, "INVALID_LENGTH");
            return;
        }

        if ((sf.maxValue!==undefined) && (v > sf.maxValue)) {
            declareError(sf.errorMessage_maxValue || `Value must be less than ${sf.maxValue}`, "INVALID_LENGTH");
            return;
        }
    },

    "boolean": (v, f) => {
        if (typeof v !== "boolean") {
            declareError(f.errorMessage_theValueIsInvalid || `Value must be a boolean`, "INVALID_TYPE");
        }

        let sf = f as ScBoolean<any>;
        
        if (sf.requireTrue) {
            if (v!==true) {
                declareError(sf.errorMessage_requireTrue || `Value must be true`, "INVALID_VALUE");
            }
        } else if (sf.requireFalse) {
            if (v!==false) {
                declareError(sf.errorMessage_requireFalse || `Value must be false`, "INVALID_VALUE");
            }
        }
    }
}

export function validateSchema(data: any, schema: Schema): ValidationErrors|undefined {
    if (schema.schemaMeta.normalize) {
        try {
            schema.schemaMeta.normalize(data);
        }
        catch (e: any) {
            if (e instanceof SchemaError) {
                return {
                    globalError: e.errorMessage || `Schema validation failed`,
                    globalErrorCode: e.errorCode || "SCHEMA_VALIDATION_FAILED"
                };
            }
            else {
                throw e;
            }
        }
    }

    let fieldErrors: Record<string, FieldError>|undefined;

    for (let fieldName in schema.desc) {
        let defaultErrorMessage: string|undefined;

        try {
            const field = schema.desc[fieldName];
            const value = data[fieldName];

            if (field.normalize) {
                defaultErrorMessage = field.errorMessage_theValueIsInvalid;
                field.normalize(value, data);
            }

            if (!field.optional) {
                if (value === undefined) {
                    if (field.errorMessage_isRequired) {
                        declareError(field.errorMessage_isRequired, "VALUE_REQUIRED");
                    } else if (field.errorMessage_theValueIsInvalid) {
                        declareError(field.errorMessage_theValueIsInvalid, "VALUE_REQUIRED");
                    } else {
                        declareError(`Field ${fieldName} is required`, "VALUE_REQUIRED");
                    }
                }
            }

            let typeValidator = byTypeValidator[field.type];

            if (typeValidator) {
                typeValidator(value, field);
            }

            if (field.validator) {
                defaultErrorMessage = field.errorMessage_theValueIsInvalid;
                field.validator(value, data);
            }
        }
        catch (e: any) {
            if (e instanceof SchemaError) {
                if (!fieldErrors) fieldErrors = {};

                fieldErrors[fieldName] = {
                    fieldName,
                    message: e.errorMessage || defaultErrorMessage || `Field ${fieldName} is invalid`,
                    code: e.errorCode || "FIELD_VALIDATION_FAILED"
                };
            } else {
                throw e;
            }
        }
    }

    if (schema.schemaMeta.validate) {
        try {
            schema.schemaMeta.validate(data);
        }
        catch (e: any) {
            if (e instanceof SchemaError) {
                return {
                    globalError: e.errorMessage || `Schema validation failed`,
                    globalErrorCode: e.errorCode || "SCHEMA_VALIDATION_FAILED",
                    fields: fieldErrors
                };
            }
            else {
                throw e;
            }
        }
    }

    if (!fieldErrors) return undefined;
    return {fields: fieldErrors};
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

export function schema<T extends SchemaDescriptor>(descriptor: T, meta?: SchemaMeta): Schema & { desc: T } {
    return { desc: descriptor, schemaMeta: meta || {} };
}

export interface SchemaDescriptor  {
    [field: string]: ScField<any, any>;
}

export interface SchemaMeta {
    title?: string;
    description?: string;
    [key: string]: any;
    
    normalize?: (allValues: any) => void;
    validate?: (allValues: any) => void;
}

export interface SchemaInfo {
    desc: SchemaDescriptor,
    schemaMeta: SchemaMeta
}

export interface Schema extends SchemaInfo {
}

export function toJson(schema: Schema): SchemaInfo {
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
// 1. On accède au descripteur de schéma S['desc']
// 2. On itère sur ses clés K
// 3. On filtre les champs obligatoires (Opt = false)
    { [K in keyof S['desc'] as S['desc'][K] extends ScField<any, false> ? K : never]:
        // 4. On infère le type T du champ
        S['desc'][K] extends ScField<infer T, any> ? T : never }

    // 5. On fusionne avec les champs optionnels (Opt = true)
    & { [K in keyof S['desc'] as S['desc'][K] extends ScField<any, true> ? K : never] ?:
    S['desc'][K] extends ScField<infer T, any> ? T : never };

export interface ScField<T, Opt extends boolean> {
    title: string;
    type: string;

    description?: string;
    default?: T;
    optional?: Opt;

    errorMessage_isRequired?: string;
    errorMessage_theDataTypeIsInvalid?: string;
    errorMessage_theValueIsInvalid?: string;

    normalize?: (value: T, allValues: any) => void;
    validator?: (value: T, allValues: any) => void;

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

    placeholder?: string;
}

export function string<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScString<Opt>>): ScString<Opt> {
    if (!optional) {
        if (!infos) infos = {};
        if (infos.minLength===undefined) infos.minLength = 1;
    }

    return {...infos, title, optional, type: "string"};
}

//endregion

//region Boolean

export interface ScBoolean<Opt extends boolean> extends ScField<boolean, Opt> {
    requireTrue?: boolean;
    errorMessage_requireTrue?: string;
    
    requireFalse?: boolean;
    errorMessage_requireFalse?: string;
}

export function boolean<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScBoolean<Opt>>): ScBoolean<Opt> {
    return {...infos, title, optional, type: "boolean"};
}

//endregion

//region Number

export interface ScNumber<Opt extends boolean> extends ScField<number, Opt> {
    minValue?: number;
    errorMessage_minValue?: string;

    maxValue?: number;
    errorMessage_maxValue?: string;

    // TODO: allowDecimal
    allowDecimal?: boolean;
    roundMethod?: "round" | "floor" | "ceil";
    errorMessage_dontAllowDecimal?: string;

    incrStep?: number;
    placeholder?: string;
}

export function number<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScNumber<Opt>>): ScNumber<Opt> {
    return {...infos, title, optional, type: "number"};
}

//endregion

//endregion

/*const UserSchema1 = schema({
    name: string("The name", false),
    yesTrue: boolean("Accept", false),
    age: number("Age", false),
    test: string("Test", true)
});

type UserDataType1 = SchemaToType<typeof UserSchema1>;
let ud1: UserDataType1 = {name:"ok", yesTrue: true, _age: 5};*/
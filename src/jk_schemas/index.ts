// noinspection JSUnusedGlobalSymbols

import {generateUUIDv4} from "jopi-toolkit/jk_tools";

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

export interface FieldError {
    fieldName: string;
    message: string;
    code?: string;
}

export interface ValidationErrors {
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

export function validateSchema(data: any, schema: Schema): ValidationErrors|undefined {
    // Normalize the data.
    // It's a step where we apply automatic corrections.
    //
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

    // >>> Check each field individually.

    // Each time it will:
    // - Normalize the value.
    // - Check if optional + undefined.
    // - Apply validator for the field type.

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

    // >>> Validate the whole fields.
    //     Allow validating if values are ok with each others.

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

    // No error ? --> undefined.
    // Otherwise returns the errors.
    //
    if (!fieldErrors) return undefined;
    return {fields: fieldErrors};
}

const byTypeValidator: Record<string, (v: any, fieldInfos: SchemaFieldInfos) => void> = {};

//endregion

//region Registry

interface RegistryEntry {
    schema: Schema;
    meta?: any;
}

export function registerSchema(schemaId: string|undefined, schema: Schema, meta?: any) {
    if (!schemaId) {
        throw new Error("jk_schemas - Schema id required. If you need an uid you can use: " + generateUUIDv4());
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
        throw new Error(`jk_schemas - Schema ${schemaId} not found`);
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
    { [K in keyof S['desc'] as S['desc'][K] extends ScField<any, false> ? K : never]:
        S['desc'][K] extends ScField<infer T, any> ? T : never }

    & { [K in keyof S['desc'] as S['desc'][K] extends ScField<any, true> ? K : never] ?:
    S['desc'][K] extends ScField<infer T, any> ? T : never };

interface ScField<T, Opt extends boolean> {
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

    /**
     * If true, then allows hiding the column
     * when rendering into a UI table component.
     */
    tableEnableHiding?: boolean;

    /**
     * If true, then the table column is hidden by default.
     */
    tableDefaultHidden?: boolean;

    /**
     * If true, then the table column is hidden and remain hidden.
     */
    tableAlwaysHidden?: boolean;

    /**
     * If true, then allows sorting the column
     * when rendering into a UI table component.
     */
    tableEnableSorting?: boolean;

    /**
     * If true, then allows editing the column
     * when rendering into a UI table component.
     */
    tableEnableEditing?: boolean;

    /**
     * Contains the name of the renderer to user for the header.
     */
    tableHeaderRenderer?: string;

    /**
     * Contains the name of the renderer to user for the cell.
     */
    tableCellRenderer?: string;
}

export type Field = ScField<any, any>;
export type SchemaFieldInfos = Field;

type OnlyInfos<T> = Omit<T, "title" | "optional" | "type">;

//endregion

//region Common types

//region String

export interface ScString<Opt extends boolean = boolean> extends ScField<string, Opt> {
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

byTypeValidator["string"] = (v,f) => {
    if (typeof v !== "string") {
        declareError(f.errorMessage_theValueIsInvalid || `Value must be a string`, "INVALID_TYPE");
        return;
    }

    let sf = f as ScString<any>;

    if ((sf.minLength !== undefined) && (v.length < sf.minLength)) {
        declareError(sf.errorMessage_minLength || `Value must be at least ${sf.minLength} characters long`, "INVALID_LENGTH");
        return;
    }

    if ((sf.maxLength !== undefined) && (v.length > sf.maxLength)) {
        declareError(sf.errorMessage_maxLength || `Value must be less than ${sf.maxLength} characters long`, "INVALID_LENGTH");
        return;
    }
};

//endregion

//region Boolean

export interface ScBoolean<Opt extends boolean = boolean> extends ScField<boolean, Opt> {
    requireTrue?: boolean;
    errorMessage_requireTrue?: string;
    
    requireFalse?: boolean;
    errorMessage_requireFalse?: string;
}

export function boolean<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScBoolean<Opt>>): ScBoolean<Opt> {
    return {...infos, title, optional, type: "boolean"};
}

byTypeValidator["boolean"] = (v, f) => {
    if (typeof v !== "boolean") {
        declareError(f.errorMessage_theValueIsInvalid || `Value must be a boolean`, "INVALID_TYPE");
    }

    let sf = f as ScBoolean<any>;

    if (sf.requireTrue) {
        if (v !== true) {
            declareError(sf.errorMessage_requireTrue || `Value must be true`, "INVALID_VALUE");
        }
    } else if (sf.requireFalse) {
        if (v !== false) {
            declareError(sf.errorMessage_requireFalse || `Value must be false`, "INVALID_VALUE");
        }
    }
};

//endregion

//region Number

export interface ScNumber<Opt extends boolean = boolean> extends ScField<number, Opt> {
    minValue?: number;
    errorMessage_minValue?: string;

    maxValue?: number;
    errorMessage_maxValue?: string;

    allowDecimal?: boolean;

    roundMethod?: "round" | "floor" | "ceil";
    errorMessage_dontAllowDecimal?: string;

    incrStep?: number;
    placeholder?: string;

    /**
     * Allows displaying this value as a simple
     * number, or a current, or a percent.
     */
    displayType?: "decimal" | "currency" | "percent";

    /**
     * The regional currency format to use for formating.
     * Ex: "en-US", "fr-FR".
     */
    localFormat?: string;

    /**
     * The type of currency.
     * Ex: "USD".
     */
    currency?: string;
}

export function number<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScNumber<Opt>>): ScNumber<Opt> {
    return {...infos, title, optional, type: "number"};
}

export function formatNumber(value: string, fieldNumber: ScNumber, defaultLocalFormat: string = "en-US", defaultCurrency: string = "USD") {
    const amount = parseFloat(value);

    let localFormat = fieldNumber.localFormat || defaultLocalFormat;

    switch (fieldNumber.displayType) {
        case "currency":
            return new Intl.NumberFormat(localFormat, {
                style: "currency",
                currency: fieldNumber.currency || defaultCurrency,
            }).format(amount);
        default:
            return new Intl.NumberFormat(localFormat, {style: fieldNumber.displayType || "decimal"}).format(amount);
    }
}

byTypeValidator["number"] = (v,f) => {
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
}

//endregion

//region Currency

export function currency<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScNumber<Opt>>): ScNumber<Opt> {
    return number(title, optional, {...infos, displayType: "currency"})
}

//endregion

//region Percent

export function percent<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScNumber<Opt>>): ScNumber<Opt> {
    return number(title, optional, {...infos, displayType: "percent"})
}


//endregion

//region File

export interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;
}

export interface ScFile<Opt extends boolean> extends ScField<File[], Opt> {
    maxFileCount?: number;
    errorMessage_maxFileCount?: string;

    acceptFileType?: string;
    errorMessage_invalidFileType?: string;

    maxFileSize?: number;
    errorMessage_maxFileSize?: string;
}

export function file<Opt extends boolean>(title: string, optional: Opt, infos?: OnlyInfos<ScFile<Opt>>): ScFile<Opt> {
    return {...infos, title, optional, type: "file"};
}

//endregion

//endregion

/*const MAKE_OPTIONAL = true;
//
const UserSchema1 = schema({
    testOptional: string("testOptional", true),
    testString: string("testString", MAKE_OPTIONAL),
    testBool: boolean("testBool", MAKE_OPTIONAL),
    testNumber: number("testNumber", MAKE_OPTIONAL),
    testFile: file("testFile", MAKE_OPTIONAL)
})

type UserDataType1 = SchemaToType<typeof UserSchema1>;
let ud1: UserDataType1 = {};*/
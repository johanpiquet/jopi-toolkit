// noinspection JSUnusedGlobalSymbols
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { generateUUIDv4 } from "jopi-toolkit/jk_tools";
//region Validation
/**
 * Throwing this error allows it to be caught
 * when validating an object.
 */
var SchemaError = /** @class */ (function (_super) {
    __extends(SchemaError, _super);
    function SchemaError(errorMessage, errorCode) {
        var _this = _super.call(this, "") || this;
        _this.errorMessage = errorMessage;
        _this.errorCode = errorCode;
        return _this;
    }
    return SchemaError;
}(Error));
/**
 * Declare an error when validating a schema.
 * Must be called when validating or normalizing.
 */
export function declareError(message, errorCode) {
    throw new SchemaError(message, errorCode);
}
export function validateSchema(data, schema) {
    // Normalize the data.
    // It's a step where we apply automatic corrections.
    //
    if (schema.schemaMeta.normalize) {
        try {
            schema.schemaMeta.normalize(data);
        }
        catch (e) {
            if (e instanceof SchemaError) {
                return {
                    globalError: e.errorMessage || "Schema validation failed",
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
    var fieldErrors;
    for (var fieldName in schema.desc) {
        var defaultErrorMessage = void 0;
        try {
            var field = schema.desc[fieldName];
            var value = data[fieldName];
            if (field.normalize) {
                defaultErrorMessage = field.errorMessage_theValueIsInvalid;
                field.normalize(value, data);
            }
            if (!field.optional) {
                if (value === undefined) {
                    if (field.errorMessage_isRequired) {
                        declareError(field.errorMessage_isRequired, "VALUE_REQUIRED");
                    }
                    else if (field.errorMessage_theValueIsInvalid) {
                        declareError(field.errorMessage_theValueIsInvalid, "VALUE_REQUIRED");
                    }
                    else {
                        declareError("Field ".concat(fieldName, " is required"), "VALUE_REQUIRED");
                    }
                }
            }
            var typeValidator = byTypeValidator[field.type];
            if (typeValidator) {
                typeValidator(value, field);
            }
            if (field.validator) {
                defaultErrorMessage = field.errorMessage_theValueIsInvalid;
                field.validator(value, data);
            }
        }
        catch (e) {
            if (e instanceof SchemaError) {
                if (!fieldErrors)
                    fieldErrors = {};
                fieldErrors[fieldName] = {
                    fieldName: fieldName,
                    message: e.errorMessage || defaultErrorMessage || "Field ".concat(fieldName, " is invalid"),
                    code: e.errorCode || "FIELD_VALIDATION_FAILED"
                };
            }
            else {
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
        catch (e) {
            if (e instanceof SchemaError) {
                return {
                    globalError: e.errorMessage || "Schema validation failed",
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
    if (!fieldErrors)
        return undefined;
    return { fields: fieldErrors };
}
var byTypeValidator = {};
export function registerSchema(schemaId, schema, meta) {
    if (!schemaId) {
        throw new Error("jk_schemas - Schema id required. If you need an uid you can use: " + generateUUIDv4());
    }
    gRegistry[schemaId] = { schema: schema, meta: meta };
}
export function getSchemaMeta(schemaId) {
    var entry = gRegistry[schemaId];
    if (entry)
        return entry.schema;
    return undefined;
}
export function getSchema(schemaId) {
    var entry = gRegistry[schemaId];
    if (entry)
        return entry.schema;
    return undefined;
}
export function requireSchema(schemaId) {
    var s = getSchema(schemaId);
    if (!s) {
        throw new Error("jk_schemas - Schema ".concat(schemaId, " not found"));
    }
    return s;
}
var gRegistry = {};
//endregion
//region Schema
export function schema(descriptor, meta) {
    return { desc: descriptor, schemaMeta: meta || {} };
}
export function toJson(schema) {
    return schema;
}
export function string(title, optional, infos) {
    if (!optional) {
        if (!infos)
            infos = {};
        if (infos.minLength === undefined)
            infos.minLength = 1;
    }
    return __assign(__assign({}, infos), { title: title, optional: optional, type: "string" });
}
byTypeValidator["string"] = function (v, f) {
    if (typeof v !== "string") {
        declareError(f.errorMessage_theValueIsInvalid || "Value must be a string", "INVALID_TYPE");
        return;
    }
    var sf = f;
    if ((sf.minLength !== undefined) && (v.length < sf.minLength)) {
        declareError(sf.errorMessage_minLength || "Value must be at least ".concat(sf.minLength, " characters long"), "INVALID_LENGTH");
        return;
    }
    if ((sf.maxLength !== undefined) && (v.length > sf.maxLength)) {
        declareError(sf.errorMessage_maxLength || "Value must be less than ".concat(sf.maxLength, " characters long"), "INVALID_LENGTH");
        return;
    }
};
export function boolean(title, optional, infos) {
    return __assign(__assign({}, infos), { title: title, optional: optional, type: "boolean" });
}
byTypeValidator["boolean"] = function (v, f) {
    if (typeof v !== "boolean") {
        declareError(f.errorMessage_theValueIsInvalid || "Value must be a boolean", "INVALID_TYPE");
    }
    var sf = f;
    if (sf.requireTrue) {
        if (v !== true) {
            declareError(sf.errorMessage_requireTrue || "Value must be true", "INVALID_VALUE");
        }
    }
    else if (sf.requireFalse) {
        if (v !== false) {
            declareError(sf.errorMessage_requireFalse || "Value must be false", "INVALID_VALUE");
        }
    }
};
export function number(title, optional, infos) {
    return __assign(__assign({}, infos), { title: title, optional: optional, type: "number" });
}
byTypeValidator["number"] = function (v, f) {
    if (typeof v !== "number") {
        declareError(f.errorMessage_theValueIsInvalid || "Value must be a number", "INVALID_TYPE");
    }
    var sf = f;
    if ((sf.minValue !== undefined) && (v < sf.minValue)) {
        declareError(sf.errorMessage_minValue || "Value must be at least ".concat(sf.minValue), "INVALID_LENGTH");
        return;
    }
    if ((sf.maxValue !== undefined) && (v > sf.maxValue)) {
        declareError(sf.errorMessage_maxValue || "Value must be less than ".concat(sf.maxValue), "INVALID_LENGTH");
        return;
    }
};
export function file(title, optional, infos) {
    return __assign(__assign({}, infos), { title: title, optional: optional, type: "file" });
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

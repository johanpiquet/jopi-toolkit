import type {Schema} from "jopi-toolkit/jk_schema";

export interface JFieldSorting {
    field: string;
    direction: "asc" | "desc";
}

export interface JRowsFilter {
    field?: string;
    value: string;
}

export interface JFieldFilter {
    value?: string | number | boolean;
    constraint: JFieldConstraintType;
    caseSensitive?: boolean;
}

export type JFieldConstraintType =
    | "$eq"    // Equals
    | "$ne"    // Not equals
    | "$gt"    // Greater than
    | "$gte"   // Greater than or equals
    | "$lt"    // Less than
    | "$lte"   // Less than or equals
    | "$in"    // In an array of values
    | "$nin"   // Not in an array of values
    | "$like"  // Like search %endsWith or startsWith%

export interface JRowArrayFilter {
    offset: number;
    count: number;

    filter?: JRowsFilter;
    sorting?: JFieldSorting[];
    fieldFilters?: Record<string, JFieldFilter[]>;
}

export interface JDataRowSource_ReadParams extends JRowArrayFilter {
}

export interface JDataRowSource_ReadResult {
    rows: any[];
    total?: number;
    offset?: number;
}

export interface JDataRowSource {
    get schema(): Schema;
    read(params: JDataRowSource_ReadParams): Promise<JDataRowSource_ReadResult>;
}

export class JDataRowSource_UseArray implements JDataRowSource {
    public constructor(public readonly schema: Schema, private readonly rows: any[]) {
    }

    async read(params: JDataRowSource_ReadParams): Promise<JDataRowSource_ReadResult> {
        return simpleRowArrayFilter(this.rows, params);
    }
}

export class JDataRowSource_HttpProxy implements JDataRowSource {
    public constructor(public readonly dataSourceName: string, private readonly url: string, public readonly schema: Schema) {
    }

    async read(params: JDataRowSource_ReadParams): Promise<JDataRowSource_ReadResult> {
        let toSend = {dsName: this.dataSourceName, read: params};
        let res = await fetch(this.url, {method: "POST", body: JSON.stringify(toSend)});

        if (res.status !== 200) {
            throw new Error(`Error while reading data source ${this.dataSourceName}`);
        }

        let asJson = await res.json();
        return asJson as JDataRowSource_ReadResult;
    }
}

/**
 * Filter the row content according to rules.
 */
export function simpleRowArrayFilter(rows: any[], params: JRowArrayFilter): JDataRowSource_ReadResult {
    // > Apply filter.

    if (params.filter) {
        const f = params.filter;

        rows = rows.filter(r => {
            if (f.field) {
                let v = r[f.field];
                if (v===undefined) return false;
                return String(v).includes(f.value);
            } else {
                for (let v of Object.values(r)) {
                    if (v===undefined) continue;
                    if (String(v).includes(f.value)) return true;
                }

                return false;
            }
        });
    }

    // > Apply sorting.

    if (params.sorting && params.sorting.length) {
        debugger;
        const sorting = params.sorting[0];
        const sortField = sorting.field;
        const sortDir = sorting.direction;

        rows = rows.sort((a, b) => {
            let av = a[sortField];
            let bv = b[sortField];

            if (av === undefined) av = "";
            if (bv === undefined) bv = "";

            const avIsNumber = typeof av === "number";
            const bvIsNumber = typeof bv === "number";

            if (avIsNumber && bvIsNumber) {
                if (sortDir === "asc") {
                    return av - bv;
                } else {
                    return bv - av;
                }
            } else {
                const avStr = String(av);
                const bvStr = String(bv);

                if (sortDir === "asc") {
                    return avStr.localeCompare(bvStr);
                } else {
                    return bvStr.localeCompare(avStr);
                }
            }
        });
    }

    const totalWithoutPagination = rows.length;

    rows = rows.slice(params.offset, params.offset + params.count);

    return {
        rows, total: totalWithoutPagination,
        offset: params.offset
    }
}
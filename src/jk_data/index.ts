import type {Schema} from "jopi-toolkit/jk_schema";

//region Rows Arrays

export interface JFieldSorting {
    field: string;
    direction: "asc" | "desc";
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

export interface JRowsFilter {
    field?: string;
    value: string;
}

export interface JRowArrayFilter {
    offset: number;
    count: number;

    filter?: JRowsFilter;
    sorting?: JFieldSorting[];
    fieldFilters?: Record<string, JFieldFilter[]>;
}

/**
 * Filter the row content according to rules.
 */
export function simpleRowArrayFilter(rows: any[], params: JRowArrayFilter): JTableDs_ReadResult {
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

//endregion

//region JTableDs

export interface JTableDs_ReadParams extends JRowArrayFilter {
}

export interface JTableDs_ReadResult {
    rows: any[];
    total?: number;
    offset?: number;
}

export interface JTableDs {
    get name(): string;
    get schema(): Schema;
    read(params: JTableDs_ReadParams): Promise<JTableDs_ReadResult>;
}

export class JTableDs_UseArray implements JTableDs {
    public constructor(public readonly name: string, public readonly schema: Schema, private readonly rows: any[]) {
    }

    async read(params: JTableDs_ReadParams): Promise<JTableDs_ReadResult> {
        return simpleRowArrayFilter(this.rows, params);
    }
}

export class JTableDs_HttpProxy implements JTableDs {
    public constructor(public readonly name: string, private readonly url: string, public readonly schema: Schema) {
    }

    async read(params: JTableDs_ReadParams): Promise<JTableDs_ReadResult> {
        let toSend = {dsName: this.name, read: params};

        let res = await fetch(this.url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(toSend)
        });

        if (res.status !== 200) {
            throw new Error(`Error while reading data source "${this.name}"`);
        }

        let asJson = await res.json();
        return asJson as JTableDs_ReadResult;
    }
}

//endregion

export function generateUUIDv4(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function isUUIDv4(text: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text);
}

export function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    return "" + e;
}

export function applyDefaults<T>(source: T|undefined, defaults: T): T {
    if (!source) source = {} as T;
    return {...defaults, ...source};
}

//region Registry

export type AsyncProvider = () => Promise<any>;

export class Registry {
    providers: Record<string, Record<string, AsyncProvider>> = {};
    registry: Record<string, Record<string, unknown>> = {};

    addProvider(category: string, name: string, provider: AsyncProvider) {
        let categoryRef = this.providers[category];
        if (!categoryRef) this.providers[category] = categoryRef = {};
        categoryRef[name] = provider;
    }

    protected getProvider(category: string, name: string): AsyncProvider | undefined {
        return this.providers[category]?.[name];
    }

    protected getItem<T>(category: string, name: string): T | undefined {
        return this.registry[category]?.[name] as T|undefined;
    }

    protected setItem<T>(category: string, name: string, value: T) {
        this.registry[category] = this.registry[category] || {};
        this.registry[category][name] = value;
    }

    addEventProvider(eventName: string, provider: AsyncProvider) {
        this.addProvider("event", eventName, provider);
    }

    async getEvent(eventName: string): Promise<Event> {
        let event = this.getItem<Event>("event", eventName);
        if (event) return event;

        let provider = this.getProvider("event", eventName);
        const listeners = provider ? await provider() : [];

        event = new Event(eventName, listeners);
        this.setItem("event", eventName, event);
        return event;
    }
}

//endregion
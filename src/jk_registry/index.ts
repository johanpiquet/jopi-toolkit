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

export class Event<T = any> {
    constructor(public readonly name: string, private readonly listeners: EventListener<T>[]) {
    }

    async send(data: T): Promise<T> {
        for (let listener of this.listeners) {
            const r = listener(data);
            if (r instanceof Promise) await r;
        }

        return data;
    }

    async sendSync(data: T): Promise<T> {
        for (let listener of this.listeners) {
            listener(data);
        }

        return data;
    }
}

export type EventListener<T> = (data: T) => void|Promise<void>;
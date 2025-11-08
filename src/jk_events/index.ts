import {PriorityLevel as EventPriority} from "jopi-toolkit/jk_tools";
// Warning: it's export.
export {PriorityLevel as EventPriority} from "jopi-toolkit/jk_tools";

// noinspection JSUnusedGlobalSymbols

export type EventListener<T = any> = (e: T, eventName: string) => void|Promise<void>;

export type EventListenerProvider = () => Promise<EventListener[]>;

export class EventGroup {
    private readonly listenersFor: Record<string, PriorityArray<EventListener>> = {};
    private evenSpy: undefined | ((eventName: string, data?: any) => void);
    private readonly providers: Record<string, EventListenerProvider> = {};

    newEventGroup(): EventGroup {
        return new EventGroup();
    }

    enableEventSpying(spy: (eventName: string, data?: any) => void) {
        this.evenSpy = spy;
    }

    removeListener(eventName: string, listener: any): void {
        const events = this.listenersFor[eventName];
        if (events) events.remove(listener);
    }

    sendEvent(eventName: string, e?: any|undefined): void {
        if (this.evenSpy) this.evenSpy(eventName, e);

        const events = this.listenersFor[eventName];
        if (!events) return;

        if (events.value) {
            const values = events.value;

            for (const listener of values) {
                listener(e, eventName);
            }
        }
    }

    async sendAsyncEvent(eventName: string, e?: any|undefined): Promise<void> {
        if (this.evenSpy) this.evenSpy(eventName, e);

        let events = this.listenersFor[eventName];

        if (!events) {
            let provider = this.providers[eventName];

            events = new PriorityArray();

            if (provider) {
                let listeners = await provider();
                for (let listener of listeners) events.add(EventPriority.default, listener);
            }

            this.listenersFor[eventName] = events;
        }

        if (events.value) {
            const values = events.value;

            for (const listener of values) {
                let r = listener(e, eventName);
                if (r instanceof Promise) await r;
            }
        }
    }

    addListener<T = any|undefined>(eventName: string, priorityOrListener: EventPriority | EventListener<T>, listener?: EventListener<T>): void {
        let priority: EventPriority;
        let actualListener: EventListener;

        if (typeof priorityOrListener === 'function') {
            // Cas où priority n'est pas fournie, priorityOrListener est le listener
            priority = EventPriority.default;
            actualListener = priorityOrListener;
        } else {
            // Cas où priority est fournie
            priority = priorityOrListener;
            actualListener = listener!;
        }

        let events = this.listenersFor[eventName];
        if (!events) this.listenersFor[eventName] = events = new PriorityArray<EventListener>();
        events.add(priority, actualListener);
    }

    /**
     * For async events, allow loading some elements (import)
     * only when the event is emitted for the time.
     */
    addProvider(eventName: string, provider: EventListenerProvider) {
        this.providers[eventName] = provider;
    }
}

//region PriorityArray

/**
 * Allows building an array which entries are sorted by priority.
 */
class PriorityArray<T> {
    private entries: PriorityArrayEntry<T>[] = [];
    private build: T[]|undefined;

    add(priority: EventPriority, value: T) {
        this.build = undefined;
        this.entries.push({priority, value});
    }

    remove(value: T) {
        this.build = undefined;
        this.entries = this.entries.filter(e => e.value !== value);
    }

    get value(): T[] {
        if (this.build) {
            return this.build;
        }

        return this.build = this.entries
            .sort((a,b) => Number(a.priority) - Number(b.priority))
            .map(e => e.value);
    }
}

interface PriorityArrayEntry<T> {
    priority: EventPriority;
    value: T;
}

//endregion

export class IsolatedEvent {
    constructor(public readonly eventName: string, private readonly eventItems: EventListener[]) {
    }

    async send<T>(data: T): Promise<T> {
        for (const listener of this.eventItems) {
            let r = listener(data, this.eventName);
            if (r instanceof Promise) await r;
        }

        return data;
    }
}

export function createIsolatedEvent(eventName: string, eventItems: EventListener[]): IsolatedEvent {
    return new IsolatedEvent(eventName, eventItems);
}

export const defaultEventGroup = new EventGroup();

export function newEventGroup(): EventGroup {
    return new EventGroup();
}

export const enableEventSpying = defaultEventGroup.enableEventSpying.bind(defaultEventGroup);
export const removeListener = defaultEventGroup.removeListener.bind(defaultEventGroup);
export const sendEvent = defaultEventGroup.sendEvent.bind(defaultEventGroup);
export const sendAsyncEvent = defaultEventGroup.sendAsyncEvent.bind(defaultEventGroup);

export function addListener<T = any|undefined>(eventName: string, priorityOrListener: EventPriority | EventListener<T>, listener?: EventListener<T>): void {
    defaultEventGroup.addListener(eventName, priorityOrListener as EventPriority, listener as EventListener<T>);
}

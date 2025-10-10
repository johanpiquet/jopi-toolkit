import {getInstance} from "./instance.ts";
import {EventPriority, type EventsImpl, type Listener} from "./__global.ts";

const NodeSpace = getInstance();

export function init_nodeSpaceEvents() {
    NodeSpace.events = new EventGroup();
}

type EventListener = (e?: any) => void;

class EventGroup implements EventsImpl {
    private readonly gEvents: Record<string, PriorityArray<EventListener>> = {};
    private gSpy: undefined | ((eventName: string, data?: any) => void);

    newEventGroup(): EventsImpl {
        return new EventGroup();
    }

    enableEventSpying(spy: (eventName: string, data?: any) => void) {
        this.gSpy = spy;
    }

    removeListener(eventName: string, listener: any): void {
        const events = this.gEvents[eventName];
        if (events) events.remove(listener);
    }

    sendEvent(eventName: string, e?: any|undefined): void {
        if (this.gSpy) this.gSpy(eventName, e);

        const events = this.gEvents[eventName];
        if (!events) return;
        const values = events.value;

        for (const listener of values) {
            listener(e);
        }
    }

    addListener(eventName: string, listener: EventListener): void;
    addListener(eventName: string, priority: EventPriority, listener: EventListener): void;
    //
    addListener(eventName: string, priorityOrListener: EventPriority | EventListener, listener?: EventListener): void {
        let priority: EventPriority;
        let actualListener: EventListener;

        if (typeof priorityOrListener === 'function') {
            // Cas où priority n'est pas fournie, priorityOrListener est le listener
            priority = EventPriority.Default;
            actualListener = priorityOrListener;
        } else {
            // Cas où priority est fournie
            priority = priorityOrListener;
            actualListener = listener!;
        }

        let events = this.gEvents[eventName];
        if (!events) this.gEvents[eventName] = events = new PriorityArray<EventListener>();
        events.add(priority, actualListener);
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
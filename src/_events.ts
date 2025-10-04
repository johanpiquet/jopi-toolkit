import {getInstance} from "./instance.ts";
import {EventPriority} from "./__global.ts";

const NodeSpace = getInstance();

export function init_nodeSpaceEvents() {
    NodeSpace.events = {
        sendEvent, addListener
    }
}

type EventListener = (e?: any|undefined) => Promise<void>;
const gEvents: Record<string, PriorityArray<EventListener>> = {};

async function sendEvent(eventName: string, e?: any|undefined): Promise<void> {
    const events = gEvents[eventName];
    if (!events) return;
    const values = events.value;

    for (const listener of values) {
        await listener(e);
    }
}

function addListener(eventName: string, priority: EventPriority, listener: EventListener): void {
    let events = gEvents[eventName];
    if (!events) gEvents[eventName] = events = new PriorityArray<EventListener>();
    events.add(priority, listener);
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
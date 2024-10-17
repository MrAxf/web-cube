export type ObservableListener<T> = (value: T) => void;
export type Observable<T> = {
    value: T;
    subscribe: (listener: ObservableListener<T>) => void;
}
export type ObservableContext = {
    observableOf: <T>(value: T) => Observable<T>;
    tick: () => void;
} 

export function createObservableContext(): ObservableContext {
    const observableValues = new Map<symbol, unknown>();
    const listeners = new Map<symbol, ObservableListener<unknown>[]>();

    const nextTick: Set<symbol> = new Set();

    function tick() {
        const currentTick = Array.from(nextTick);
        nextTick.clear();
        currentTick.forEach((key) => {
            const value = observableValues.get(key);
            const listener = listeners.get(key);
            if (listener) {
                listener.forEach((listener) => listener(value));
            }
        });
    }

    function observableOf<T>(value: T): Observable<T> {
        const key = Symbol();
        observableValues.set(key, value);
        return {
            get value() {
                return observableValues.get(key) as T;
            },
            set value(value: T) {
                if (observableValues.get(key) === value) return;
                observableValues.set(key, value);
                nextTick.add((key));
            },
            subscribe(listener: ObservableListener<T>) {
                const listenerList = (listeners.get(key) || []) as ObservableListener<T>[];
                listenerList.push(listener);
                listeners.set(key, listenerList as ObservableListener<unknown>[]);
                listener(this.value);
            }
        }
    }

    return {
        observableOf,
        tick
    }
}
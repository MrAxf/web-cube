export type ObservableListener<T> = (value: T) => void;
export interface Observable<T> {
  value: T;
  subscribe: (listener: ObservableListener<T>) => void;
}
export interface ObservableContext {
  observableOf: <T>(value: T) => Observable<T>;
  tick: () => number;
}

export function createObservableContext(): ObservableContext {
  const observableValues = new Map<symbol, unknown>();
  const listeners = new Map<symbol, ObservableListener<unknown>[]>();

  const nextTick = new Set<symbol>();

  function tick(): number {
    const updatedKeys = nextTick.size;
    const currentTick = Array.from(nextTick);
    nextTick.clear();
    currentTick.forEach((key) => {
      const value = observableValues.get(key);
      const listenerList = listeners.get(key);
      if (listenerList) {
        listenerList.forEach((listener) => listener(value));
      }
    });
    return updatedKeys;
  }

  function observableOf<T>(value: T): Observable<T> {
    // eslint-disable-next-line symbol-description
    const key = Symbol();
    observableValues.set(key, value);
    return {
      get value() {
        return observableValues.get(key) as T;
      },
      set value(setValue: T) {
        if (observableValues.get(key) === setValue) return;
        observableValues.set(key, setValue);
        nextTick.add(key);
      },
      subscribe(listener: ObservableListener<T>) {
        const listenerList = (listeners.get(key) ??
          []) as ObservableListener<T>[];
        listenerList.push(listener);
        listeners.set(key, listenerList as ObservableListener<unknown>[]);
        listener(this.value);
      },
    };
  }

  return {
    observableOf,
    tick,
  };
}

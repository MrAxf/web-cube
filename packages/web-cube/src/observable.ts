export type ObservableListener<T> = (value: T) => void;
export interface Observable<T> {
  value: T;
  subscribe: (listener: ObservableListener<T>) => void;
}
export interface ObservableContext {
  observableOf: <T>(value: T) => Observable<T>;
  tick: () => number;
}

interface ObservableStore<T> {
  value: T;
  listeners: ObservableListener<T>[];
}

export function createObservableContext(): ObservableContext {
  const nextTick = new Set<ObservableStore<unknown>>();

  function tick(): number {
    const updatedKeys = nextTick.size;
    const currentTick = Array.from(nextTick);
    nextTick.clear();
    currentTick.forEach((store) => {
      store.listeners.forEach((listener) => listener(store.value));
    });
    return updatedKeys;
  }

  function observableOf<T>(value: T): Observable<T> {
    const store: ObservableStore<T> = {
      value,
      listeners: [],
    };

    return {
      get value() {
        return store.value;
      },
      set value(setValue: T) {
        if (store.value === setValue) return;
        store.value = setValue;
        nextTick.add(store as ObservableStore<unknown>);
      },
      subscribe(listener: ObservableListener<T>) {
        store.listeners.push(listener);
        listener(this.value);
      },
    };
  }

  return {
    observableOf,
    tick,
  };
}

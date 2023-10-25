import type { ReadonlyStateVar, StateOptions, StateVar } from 'lit-shared-state';

// use an internal prefix to avoid collisions with
// other packages in local storage
const STORAGE_PREFIX = 'webdmx-';

/**
 * Persistance layer for the managed global state.
 * https://sijakret.github.io/lit-shared-state/#Custom-Storage
 */
export const persistLocalStorage = (prefix = STORAGE_PREFIX) =>
  ({
    // save to local storage
    set<T>(stateVar: StateVar<T>, value: T) {
      // store state in local storage, don't forget to notify
      localStorage.setItem(`${prefix}${stateVar.key}`, JSON.stringify(value));
      stateVar.notifyObservers(stateVar.key, value);
    },
    // load from local storage, fall back to undefined
    get<T>(stateVar: ReadonlyStateVar<T>): T | undefined {
      // read from local storage and parse JSON if defined
      const stored = localStorage.getItem(`${prefix}${stateVar.key}`);
      return stored ? JSON.parse(stored) : undefined;
    },
    // initialize from local storage
    init<T>(stateVar: ReadonlyStateVar<T>, initialValue?: T): T | undefined {
      const value = stateVar.options.get(stateVar);
      // if the value is undefined, we store the initial value
      // as it will be read right after initialization
      if (value === undefined && initialValue !== undefined) {
        localStorage.setItem(`${prefix}${stateVar.key}`, JSON.stringify(initialValue));
      }
      // fall back to initializer value
      return value ?? initialValue;
    },
  }) satisfies StateOptions;

// Keep the typed storage private while consumers receive immutable arrays.
export const arrayStorage = new WeakMap<readonly number[], Uint8Array>();

export function toPublicArray<T extends number>(values: Uint8Array): readonly T[] {
  const copy = new Array<T>(values.length);
  for (let index = 0; index < values.length; index++) copy[index] = values[index] as T;
  arrayStorage.set(copy, values);
  return Object.freeze(copy);
}

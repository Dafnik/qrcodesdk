// Class instances keep their identity in frameworks that deeply proxy plain objects.
class CenterImageValue {}

/** Keeps rendering functions behind factory-owned object identities. */
export function createCenterImageStore<T extends object>() {
  const values = new WeakMap<object, T>();
  return {
    create(value: T): object {
      const image = Object.freeze(new CenterImageValue());
      values.set(image, value);
      return image;
    },
    resolve(image: object | undefined): T | undefined {
      return image === undefined ? undefined : values.get(image);
    },
  };
}

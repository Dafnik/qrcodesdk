/** A growable byte array. */
export class ByteBuffer {
  private bytes = new Uint8Array(4096);
  length = 0;

  push(value: number): void {
    this.reserve(1);
    this.bytes[this.length++] = value;
  }

  pushBytes(values: ArrayLike<number>): void {
    this.reserve(values.length);
    this.bytes.set(values, this.length);
    this.length += values.length;
  }

  toUint8Array(): Uint8Array {
    return this.bytes.slice(0, this.length);
  }

  private reserve(count: number): void {
    if (this.length + count > this.bytes.length) {
      const bytes = new Uint8Array((this.length + count) * 2);
      bytes.set(this.bytes);
      this.bytes = bytes;
    }
  }
}

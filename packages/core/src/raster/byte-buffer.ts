/** A growable byte array. */
export class ByteBuffer {
  private bytes = new Uint8Array(4096);
  length = 0;

  push(value: number): void {
    if (this.length === this.bytes.length) this.reserve(1);
    this.bytes[this.length++] = value;
  }

  pushBytes(values: ArrayLike<number>): void {
    this.reserve(values.length);
    this.bytes.set(values, this.length);
    this.length += values.length;
  }

  pushASCII(value: string): void {
    for (let index = 0; index < value.length; index++) this.push(value.charCodeAt(index));
  }

  pushUint16LE(value: number): void {
    this.push(value & 0xff);
    this.push((value >>> 8) & 0xff);
  }

  pushUint16BE(value: number): void {
    this.push((value >>> 8) & 0xff);
    this.push(value & 0xff);
  }

  pushUint32LE(value: number): void {
    this.pushUint16LE(value & 0xffff);
    this.pushUint16LE(value >>> 16);
  }

  toUint8Array(): Uint8Array {
    return this.bytes.slice(0, this.length);
  }

  private reserve(count: number): void {
    if (this.length + count <= this.bytes.length) return;
    let size = this.bytes.length * 2;
    while (size < this.length + count) size *= 2;
    const bytes = new Uint8Array(size);
    bytes.set(this.bytes.subarray(0, this.length));
    this.bytes = bytes;
  }
}

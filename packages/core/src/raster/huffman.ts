import {ByteBuffer} from './byte-buffer';

const MAX_CODE_LENGTH = 15;

/**
 * Builds Huffman code lengths of at most `limit` bits. Rare symbols are given larger weights until
 * the tree fits.
 */
export function huffmanCodeLengths(histogram: Uint32Array, limit: number): Uint8Array {
  const lengths = new Uint8Array(histogram.length);
  const symbols: number[] = [];
  for (let symbol = 0; symbol < histogram.length; symbol++) {
    if (histogram[symbol]! > 0) symbols.push(symbol);
  }
  if (symbols.length <= 1) {
    if (symbols.length === 1) lengths[symbols[0]!] = 1;
    return lengths;
  }

  const leafCount = symbols.length;
  const nodeCount = 2 * leafCount - 1;
  for (let minimum = 1; ; minimum *= 2) {
    const weights = symbols.map((symbol) => Math.max(histogram[symbol]!, minimum));
    const order = symbols.map((_, index) => index);
    order.sort((left, right) => weights[left]! - weights[right]! || left - right);
    const nodeWeights = new Float64Array(nodeCount);
    order.forEach((leaf, index) => (nodeWeights[index] = weights[leaf]!));
    const parents = new Int32Array(nodeCount);
    // Leaves and merged nodes are each already sorted by weight, so two queues replace a heap.
    let nextLeaf = 0;
    let nextInternal = leafCount;
    let next = leafCount;
    const take = () =>
      nextLeaf < leafCount &&
      (nextInternal >= next || nodeWeights[nextLeaf]! <= nodeWeights[nextInternal]!)
        ? nextLeaf++
        : nextInternal++;
    for (; next < nodeCount; next++) {
      const left = take();
      const right = take();
      nodeWeights[next] = nodeWeights[left]! + nodeWeights[right]!;
      parents[left] = parents[right] = next;
    }
    const depths = new Uint16Array(nodeCount);
    let maximum = 0;
    for (let node = nodeCount - 2; node >= 0; node--) {
      depths[node] = depths[parents[node]!]! + 1;
      if (node < leafCount) maximum = Math.max(maximum, depths[node]!);
    }
    if (maximum <= limit) {
      for (let index = 0; index < leafCount; index++) {
        lengths[symbols[order[index]!]!] = depths[index]!;
      }
      return lengths;
    }
  }
}

/**
 * Assigns canonical codes to code lengths of at most 15 bits, bit-reversed because Deflate and
 * WebP bitstreams are read least significant bit first.
 */
export function reversedCanonicalCodes(lengths: Uint8Array): Uint16Array {
  const counts = new Uint16Array(MAX_CODE_LENGTH + 1);
  for (const length of lengths) if (length !== 0) counts[length]!++;
  const nextCodes = new Uint16Array(MAX_CODE_LENGTH + 1);
  for (let bits = 1, code = 0; bits <= MAX_CODE_LENGTH; bits++) {
    code = (code + counts[bits - 1]!) << 1;
    nextCodes[bits] = code;
  }
  const codes = new Uint16Array(lengths.length);
  for (let symbol = 0; symbol < lengths.length; symbol++) {
    const length = lengths[symbol]!;
    if (length === 0) continue;
    const code = nextCodes[length]!++;
    let reversed = 0;
    for (let bit = 0; bit < length; bit++) reversed |= ((code >>> bit) & 1) << (length - 1 - bit);
    codes[symbol] = reversed;
  }
  return codes;
}

/** Writes bits least significant bit first. */
export class BitWriter {
  private readonly buffer = new ByteBuffer();
  private bits = 0;
  private count = 0;

  write(value: number, count: number): void {
    this.bits |= value << this.count;
    this.count += count;
    while (this.count >= 8) {
      this.buffer.push(this.bits & 0xff);
      this.bits >>>= 8;
      this.count -= 8;
    }
  }

  /** Pads the current byte with zero bits and appends whole bytes. */
  writeBytes(values: ArrayLike<number>): void {
    this.align();
    this.buffer.pushBytes(values);
  }

  /** Pads the current byte with zero bits. */
  align(): void {
    if (this.count > 0) this.buffer.push(this.bits & 0xff);
    this.bits = 0;
    this.count = 0;
  }

  finish(): Uint8Array {
    this.align();
    return this.buffer.toUint8Array();
  }
}

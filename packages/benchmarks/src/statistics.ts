import type {BenchmarkSummary} from './types';

export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('Cannot calculate the median of an empty sample');

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

export function summarizeSamples(
  samplesMs: readonly number[],
  qrCodesPerSample: number,
): BenchmarkSummary {
  if (samplesMs.length === 0) throw new Error('Cannot summarize an empty sample');
  if (qrCodesPerSample <= 0) throw new Error('QR codes per sample must be positive');

  const medianMs = median(samplesMs);

  return {
    medianMs,
    minMs: Math.min(...samplesMs),
    maxMs: Math.max(...samplesMs),
    qrCodesPerSecond: qrCodesPerSample / (medianMs / 1_000),
  };
}

export function calculateTimeRatio(medianMs: number, qrcodeSDKMedianMs: number): number {
  if (medianMs < 0) throw new Error('Median time cannot be negative');
  if (qrcodeSDKMedianMs <= 0) throw new Error('QRCodeSDK median time must be positive');
  return medianMs / qrcodeSDKMedianMs;
}

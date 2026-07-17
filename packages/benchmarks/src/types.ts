import type {QRCodeTestFixture} from '@repo/core-testing';

export type BenchmarkCategory = 'matrix' | 'svg';
export type BenchmarkLibraryId = 'qrcodesdk' | 'qrcode' | 'qrcode-generator';

export interface BenchmarkAdapter {
  readonly id: BenchmarkLibraryId;
  readonly label: string;
  readonly version: string;
  readonly matrix: (fixture: QRCodeTestFixture) => number;
  readonly svg: (fixture: QRCodeTestFixture) => number;
}

export interface BenchmarkWorkload {
  readonly id: string;
  readonly label: string;
  readonly fixtures: readonly QRCodeTestFixture[];
  readonly repetitions: number;
  readonly qrCodesPerSample: number;
}

export interface BenchmarkSummary {
  readonly medianMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly qrCodesPerSecond: number;
}

export interface BenchmarkResult extends BenchmarkSummary {
  readonly category: BenchmarkCategory;
  readonly workloadId: string;
  readonly workloadLabel: string;
  readonly qrCodesPerSample: number;
  readonly libraryId: BenchmarkLibraryId;
  readonly libraryLabel: string;
  readonly libraryVersion: string;
  readonly samplesMs: readonly number[];
  readonly timeVsQRCodeSDK: number;
}

export interface BenchmarkReport {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly gitRevision: string | null;
  readonly environment: {
    readonly node: string;
    readonly platform: NodeJS.Platform;
    readonly release: string;
    readonly architecture: string;
    readonly cpuModel: string;
    readonly cpuCount: number;
  };
  readonly libraries: Readonly<Record<BenchmarkLibraryId, string>>;
  readonly configuration: {
    readonly samples: number;
    readonly warmupStaticPasses: number;
    readonly staticFixtureCount: number;
    readonly staticMultipliers: readonly number[];
    readonly exhaustiveFixtureCount: number;
    readonly svg: {
      readonly pixelsPerModule: number;
      readonly quietZoneModules: number;
    };
  };
  readonly results: readonly BenchmarkResult[];
  readonly checksum: number;
}

import type {QRCodeStylingFixture, QRCodeTestFixture} from '@repo/core-testing';

export type BenchmarkCategory = 'matrix' | 'automatic' | 'svg' | 'styled-svg';
export type StandardBenchmarkCategory = Exclude<BenchmarkCategory, 'styled-svg'>;
export type BenchmarkLibraryId = 'qrcodesdk' | 'qrcode' | 'qrcode-generator' | 'qr-code-styling';

export interface BenchmarkLibrary {
  readonly id: BenchmarkLibraryId;
  readonly label: string;
  readonly version: string;
}

export interface BenchmarkAdapter extends BenchmarkLibrary {
  readonly prepare?: () => void;
  readonly matrix: (fixture: QRCodeTestFixture) => number;
  readonly svg: (fixture: QRCodeTestFixture) => number;
}

export interface StyledSVGAdapter extends BenchmarkLibrary {
  readonly prepare?: () => void | Promise<void>;
  readonly styledSvg: (fixture: QRCodeStylingFixture) => number | Promise<number>;
}

export interface BenchmarkWorkload<TFixture = QRCodeTestFixture> {
  readonly id: string;
  readonly label: string;
  readonly fixtures: readonly TFixture[];
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
}

export interface BenchmarkReport {
  readonly schemaVersion: 5;
  readonly generatedAt: string;
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
    readonly warmupExhaustivePasses: number;
    readonly staticFixtureCount: number;
    readonly staticMultipliers: readonly number[];
    readonly exhaustiveFixtureCount: number;
    readonly svg: {
      readonly pixelsPerModule: number;
      readonly quietZoneModules: number;
    };
    readonly styledSvg: {
      readonly fixtureCount: number;
      readonly multipliers: readonly number[];
      readonly dimensionsFromFixtures: true;
      readonly automaticMaskSelection: true;
    };
  };
  readonly results: readonly BenchmarkResult[];
  readonly checksum: number;
}

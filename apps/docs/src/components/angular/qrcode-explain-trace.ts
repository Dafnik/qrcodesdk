import {Component, computed, input, linkedSignal} from '@angular/core';

import {HlmButtonImports} from '@spartan-ng/helm/button';

import type {QRCodeEncodingTrace} from '../explain/qrcode-trace-types.ts';
import {
  TRACE_PAGE_SIZE,
  describeCapacity,
  describeCodeword,
  describeMaskSelection,
  describeVersionSelection,
  formatCodeword,
  formatCodewords,
  tracePage,
} from '../explain/qrcode-trace-view.ts';

type BitShare = {
  readonly label: string;
  readonly bits: number;
  readonly className: string;
};

/** Presents an encoding trace. It only formats the trace; the analysis loads separately. */
@Component({
  selector: 'qrcode-explain-trace',
  imports: [HlmButtonImports],
  styles: `
    :host {
      display: block;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
      line-height: 1.25rem;
    }

    caption {
      caption-side: top;
      padding-bottom: 0.5rem;
      text-align: left;
      font-size: 0.875rem;
      font-weight: 600;
    }

    th,
    td {
      border-bottom: 1px solid var(--border);
      padding: 0.25rem 0.5rem 0.25rem 0;
      text-align: left;
      vertical-align: top;
    }

    th {
      font-weight: 500;
      color: var(--muted-foreground);
    }

    td.numeric,
    th.numeric {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
  `,
  template: `
    @let t = trace();
    <section class="grid gap-6" aria-label="Encoding trace">
      <div class="grid gap-2">
        <h3 class="text-base font-semibold" id="qr-trace-heading">Encoding trace</h3>
        <p class="text-sm font-medium">{{ capacitySummary() }}</p>
        <div
          class="bg-muted flex h-2 w-full overflow-hidden rounded-full"
          aria-hidden="true"
          data-testid="trace-capacity-bar">
          @for (share of bitShares(); track share.label) {
            <span [class]="share.className" [style.flex-grow]="share.bits"></span>
          }
        </div>
        <ul class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          @for (share of bitShares(); track share.label) {
            <li class="flex items-center gap-1.5">
              <span class="size-2 rounded-[2px]" [class]="share.className"></span>
              {{ share.label }}: {{ share.bits }} bits
            </li>
          }
        </ul>
        <ul class="text-muted-foreground grid list-disc gap-1 pl-5 text-sm leading-relaxed">
          <li>{{ versionSummary() }}</li>
          <li>
            The payload mode, the byte or character count, the header widths, and the error
            correction level decide how many bits are needed and how many fit.
          </li>
          <li>{{ maskSummary() }} The mask changes the module pattern, not the symbol size.</li>
        </ul>
        <p class="text-muted-foreground text-xs">
          Indexes start at 0. Bit offsets count from the start of the data bit stream.
        </p>
      </div>

      <div class="overflow-x-auto">
        <table>
          <caption>
            Segments
            @if (t.segmentation !== 'single') {
              <span class="text-muted-foreground font-normal">
                · {{ t.segmentation === 'automatic' ? 'mixed-mode optimizer' : 'custom segmenter' }}
              </span>
            }
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Mode</th>
              <th class="numeric" scope="col">Count</th>
              <th scope="col">Text</th>
              <th class="numeric" scope="col">Offset</th>
              <th class="numeric" scope="col">Mode + count bits</th>
              <th class="numeric" scope="col">Payload bits</th>
            </tr>
          </thead>
          <tbody>
            @for (segment of t.segments; track segment.index) {
              @for (header of eciBefore(segment.index); track header.bitOffset) {
                <tr>
                  <td></td>
                  <td>ECI</td>
                  <td class="numeric">{{ header.assignment }}</td>
                  <td>{{ header.label }}</td>
                  <td class="numeric">{{ header.bitOffset }}</td>
                  <td class="numeric">{{ header.bitLength }}</td>
                  <td class="numeric">0</td>
                </tr>
              }
              <tr>
                <td>{{ segment.index }}</td>
                <td>{{ segment.mode }}</td>
                <td class="numeric">
                  {{ segment.count }}
                  <span class="text-muted-foreground">{{ segment.countUnit }}</span>
                </td>
                <td class="max-w-48 font-mono break-all">{{ quote(segment.text) }}</td>
                <td class="numeric">{{ segment.bitOffset }}</td>
                <td class="numeric">{{ segment.modeBits }} + {{ segment.countBits }}</td>
                <td class="numeric">{{ segment.payloadBits }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="overflow-x-auto">
        <table>
          <caption>Terminator and padding</caption>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Location</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Terminator</td>
              <td>
                {{ bitRange(t.padding.terminator.bitOffset, t.padding.terminator.bitLength) }}
              </td>
              <td>
                @if (t.padding.terminator.bitLength < t.padding.terminator.fullBitLength) {
                  Truncated: {{ t.padding.terminator.bitLength }} of
                  {{ t.padding.terminator.fullBitLength }} zero bits fit.
                } @else {
                  {{ t.padding.terminator.fullBitLength }} zero bits end the data.
                }
              </td>
            </tr>
            <tr>
              <td>Alignment</td>
              <td>{{ bitRange(t.padding.alignment.bitOffset, t.padding.alignment.bitLength) }}</td>
              <td>Zero bits that complete the last partly used codeword.</td>
            </tr>
            <tr>
              <td>Pad codewords</td>
              <td>{{ codewordRange(t.padding.padCodewords.start, t.padding.padCodewords.end) }}</td>
              <td>Alternating EC and 11 fill the remaining data codewords.</td>
            </tr>
            @if (t.padding.finalPartialCodeword; as partial) {
              <tr>
                <td>Final 4-bit codeword</td>
                <td>Codeword {{ partial.codewordIndex }}</td>
                <td>
                  {{ t.symbol.version }} ends its data with a 4-bit codeword holding
                  {{ partial.content === 'pad' ? 'zero padding' : 'data' }}. Error correction counts
                  its zero low nibble, but the nibble is not placed in the matrix.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="grid gap-2">
        <h4 class="text-sm font-semibold">Error correction blocks</h4>
        <p class="text-muted-foreground text-xs">
          {{ t.capacity.dataCodewords }} data and {{ t.capacity.errorCorrectionCodewords }} error
          correction codewords in {{ t.blocks.length }}
          {{ t.blocks.length === 1 ? 'block' : 'blocks' }}. Each block gets its own Reed–Solomon
          codewords.
        </p>
        <div class="grid gap-1">
          @for (block of t.blocks; track block.index) {
            <details class="rounded-md border px-3 py-2">
              <summary class="cursor-pointer text-xs">
                Block {{ block.index }} · {{ block.dataCodewords.length }} data +
                {{ block.errorCorrectionCodewords.length }} error correction codewords · data
                codewords
                {{ codewordRange(block.dataOffset, block.dataOffset + block.dataCodewords.length) }}
              </summary>
              <dl class="mt-2 grid gap-2 text-xs">
                <div>
                  <dt class="text-muted-foreground">Data</dt>
                  <dd class="font-mono break-words">{{ hex(block.dataCodewords) }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Error correction</dt>
                  <dd class="font-mono break-words">{{ hex(block.errorCorrectionCodewords) }}</dd>
                </div>
              </dl>
            </details>
          }
        </div>
      </div>

      <div class="grid gap-2">
        <div class="overflow-x-auto">
          <table>
            <caption>
              Placement order
              <span class="text-muted-foreground font-normal">
                · codewords {{ placementPage().start }}–{{ placementPage().end - 1 }} of
                {{ t.interleaving.length }}
              </span>
            </caption>
            <thead>
              <tr>
                <th class="numeric" scope="col">Position</th>
                <th class="numeric" scope="col">Block</th>
                <th scope="col">Kind</th>
                <th class="numeric" scope="col">Index in block</th>
                <th class="numeric" scope="col">Hex</th>
              </tr>
            </thead>
            <tbody>
              @for (codeword of placementPage().items; track codeword.position) {
                <tr [attr.title]="codewordLabel(codeword)">
                  <td class="numeric">{{ codeword.position }}</td>
                  <td class="numeric">{{ codeword.blockIndex }}</td>
                  <td>{{ codeword.kind === 'data' ? 'Data' : 'Error correction' }}</td>
                  <td class="numeric">{{ codeword.indexInBlock }}</td>
                  <td class="numeric font-mono">
                    {{ codewordHex(codeword.value, codeword.placedBits) }}
                    @if (codeword.placedBits === 4) {
                      <span class="text-muted-foreground font-sans">(4 bits)</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (placementPage().pageCount > 1) {
          <nav class="flex items-center justify-between gap-2" aria-label="Placement order pages">
            <button
              [disabled]="placementPage().page === 0"
              (click)="page.set(placementPage().page - 1)"
              hlmBtn
              size="sm"
              type="button"
              variant="outline">
              Previous
            </button>
            <span class="text-muted-foreground text-xs">
              Page {{ placementPage().page + 1 }} of {{ placementPage().pageCount }}
            </span>
            <button
              [disabled]="placementPage().page === placementPage().pageCount - 1"
              (click)="page.set(placementPage().page + 1)"
              hlmBtn
              size="sm"
              type="button"
              variant="outline">
              Next
            </button>
          </nav>
        }
      </div>

      <div class="overflow-x-auto">
        <table>
          <caption>
            Mask scores
            <span class="text-muted-foreground font-normal">
              · {{ t.masks.winner === 'lower' ? 'lower' : 'higher' }} wins
            </span>
          </caption>
          <thead>
            <tr>
              <th class="numeric" scope="col">Mask</th>
              <th class="numeric" scope="col">
                {{ t.family === 'micro' ? 'Edge score' : 'Penalty' }}
              </th>
              @if (t.family === 'micro') {
                <th class="numeric" scope="col">Right edge</th>
                <th class="numeric" scope="col">Bottom edge</th>
              }
              <th scope="col">Selected</th>
            </tr>
          </thead>
          <tbody>
            @if (t.family === 'micro') {
              @for (candidate of t.masks.candidates; track candidate.mask) {
                <tr [class.font-semibold]="candidate.mask === t.masks.selected">
                  <td class="numeric">{{ candidate.mask }}</td>
                  <td class="numeric">{{ candidate.score }}</td>
                  <td class="numeric">{{ candidate.rightEdge }}</td>
                  <td class="numeric">{{ candidate.bottomEdge }}</td>
                  <td>{{ selectedLabel(candidate.mask) }}</td>
                </tr>
              }
            } @else {
              @for (candidate of t.masks.candidates; track candidate.mask) {
                <tr [class.font-semibold]="candidate.mask === t.masks.selected">
                  <td class="numeric">{{ candidate.mask }}</td>
                  <td class="numeric">{{ candidate.score }}</td>
                  <td>{{ selectedLabel(candidate.mask) }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
        @if (t.family === 'micro') {
          <p class="text-muted-foreground mt-2 text-xs leading-relaxed">
            Micro QR codes count dark modules along the right and bottom edges. The score is 16 ×
            the smaller count + the larger count.
          </p>
        } @else {
          <p class="text-muted-foreground mt-2 text-xs leading-relaxed">
            The penalty adds four rules: runs of one color, 2 × 2 blocks, finder-like patterns, and
            the deviation from 50% dark modules.
          </p>
        }
      </div>
    </section>
  `,
})
export class QRCodeExplainTrace {
  readonly trace = input.required<QRCodeEncodingTrace>();

  /** The placement order page. A new trace keeps the page when it still exists. */
  protected readonly page = linkedSignal<QRCodeEncodingTrace, number>({
    source: this.trace,
    computation: (trace, previous) =>
      tracePage(trace.interleaving, previous?.value ?? 0, TRACE_PAGE_SIZE).page,
  });
  protected readonly placementPage = computed(() =>
    tracePage(this.trace().interleaving, this.page(), TRACE_PAGE_SIZE),
  );
  protected readonly capacitySummary = computed(() => describeCapacity(this.trace()));
  protected readonly versionSummary = computed(() => describeVersionSelection(this.trace()));
  protected readonly maskSummary = computed(() => describeMaskSelection(this.trace()));
  protected readonly bitShares = computed<readonly BitShare[]>(() => {
    const {capacity} = this.trace();
    return [
      {label: 'Headers', bits: capacity.headerBits, className: 'bg-primary/60'},
      {label: 'Payload', bits: capacity.payloadBits, className: 'bg-primary'},
      {
        label: 'Terminator and padding',
        bits: capacity.remainingBits,
        className: 'bg-muted-foreground/30',
      },
    ];
  });

  protected readonly hex = formatCodewords;
  protected readonly codewordHex = formatCodeword;
  protected readonly codewordLabel = describeCodeword;

  protected eciBefore(segmentIndex: number) {
    return this.trace().eci.filter((header) => header.segmentIndex === segmentIndex);
  }

  protected selectedLabel(mask: number): string {
    const {masks} = this.trace();
    if (mask !== masks.selected) return '';
    return masks.selection === 'requested' ? 'Requested' : 'Selected';
  }

  protected quote(text: string): string {
    return JSON.stringify(text);
  }

  protected bitRange(offset: number, length: number): string {
    if (length === 0) return 'None';
    return length === 1
      ? `Bit ${String(offset)}`
      : `Bits ${String(offset)}–${String(offset + length - 1)}`;
  }

  protected codewordRange(start: number, end: number): string {
    if (end <= start) return 'None';
    return end - start === 1 ? `${String(start)}` : `${String(start)}–${String(end - 1)}`;
  }
}

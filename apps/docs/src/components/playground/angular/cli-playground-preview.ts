import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';

import {NanostoresService} from '@nanostores/angular';
import {HlmAlertImports} from '@spartan-ng/helm/alert';

import {QRCodeSVG} from '@qrcodesdk/angular';

import {suppressInitialTransitions} from '../../angular/suppress-initial-transitions.ts';
import {cliPlaygroundOptions, cliPreview, createTerminalRows} from '../cli-playground.ts';

@Component({
  selector: 'cli-playground-preview',
  imports: [QRCodeSVG, HlmAlertImports],
  host: {class: 'block min-w-0'},
  styles: `
    .terminal {
      --terminal-background: #0d1117;
      --terminal-foreground: #e7e9ec;
      background: var(--terminal-background);
      color: var(--terminal-foreground);
      border: 1px solid #30363d;
      border-radius: 0.75rem;
      overflow: hidden;
    }
    .terminal-header {
      display: grid;
      grid-template-columns: 3.5rem minmax(0, 1fr) 3.5rem;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #30363d;
      background: #161b22;
    }
    .window-dots {
      display: flex;
      gap: 0.5rem;
    }
    .window-dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      background: #ff5f57;
    }
    .window-dot:nth-child(2) {
      background: #febc2e;
    }
    .window-dot:nth-child(3) {
      background: #28c840;
    }
    .terminal-title {
      color: #8b949e;
      font-size: 0.75rem;
      font-weight: 500;
      text-align: center;
    }
    .terminal-body {
      padding: 1rem;
      overflow: auto;
      max-height: 34rem;
    }
    .prompt {
      margin: 0 0 1.25rem;
      padding: 0;
      background: transparent;
      border: 0;
      font:
        12px/1.6 ui-monospace,
        monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .prompt-symbol {
      color: #3fb950;
    }
    .prompt-directory {
      color: #58a6ff;
    }
    .prompt-ready {
      margin: 1.25rem 0 0;
    }
    .terminal-cursor {
      display: inline-block;
      width: 1ch;
      height: 1.2em;
      vertical-align: -0.2em;
      background: var(--terminal-foreground);
      animation: cursor-blink 1.1s steps(1, end) infinite;
    }
    @keyframes cursor-blink {
      50% {
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .terminal-cursor {
        animation: none;
      }
    }
    .terminal-output {
      margin: 0;
      width: max-content;
      white-space: pre;
      /* cspell:ignore Menlo Consolas */
      font-family: 'DejaVu Sans Mono', 'Liberation Mono', Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 2ch;
      letter-spacing: 0;
      font-variant-ligatures: none;
      font-weight: 400;
    }
    .terminal-row {
      display: flex;
      height: 2ch;
    }
    .terminal-cell {
      position: relative;
      flex: 0 0 auto;
      height: 2ch;
      overflow: hidden;
      color: transparent;
    }
    /* Paint the renderer's block characters in whole or half cells to avoid font seams. */
    .terminal-cell[data-glyph='█']::before,
    .terminal-cell[data-glyph='▀']::before,
    .terminal-cell[data-glyph='▄']::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--cell-foreground, var(--terminal-foreground));
    }
    .terminal-cell[data-glyph='▀']::before {
      bottom: 50%;
    }
    .terminal-cell[data-glyph='▄']::before {
      top: 50%;
    }
    :host ::ng-deep .cli-svg svg {
      width: min(100%, 20rem);
      height: auto;
    }
    .cli-svg {
      display: flex;
      justify-content: center;
      width: 100%;
    }
  `,
  template: `
    @if (preview(); as result) {
      <div class="grid min-w-0 gap-5">
        @if (result.state === 'error') {
          <hlm-alert variant="destructive" role="alert">
            <h4 hlmAlertTitle>QR code generation failed</h4>
            <p hlmAlertDescription>{{ result.message }}</p>
          </hlm-alert>
        } @else {
          @if (options().format === 'svg') {
            <div class="grid justify-items-center gap-4 py-6">
              <qrcode-svg
                class="cli-svg"
                [payload]="options().payload"
                [options]="result.svgOptions" />
            </div>
          } @else {
            <section class="terminal" aria-label="Terminal QR code preview">
              <div class="terminal-header">
                <div class="window-dots" aria-hidden="true">
                  <span class="window-dot"></span>
                  <span class="window-dot"></span>
                  <span class="window-dot"></span>
                </div>
                <span class="terminal-title">Terminal</span>
              </div>
              <div class="terminal-body" tabindex="0" aria-label="Scrollable terminal output">
                <pre
                  class="prompt"><span class="prompt-symbol" aria-hidden="true">➜ </span><span class="prompt-directory" aria-hidden="true">~ </span>{{ result.command }}</pre>
                <div
                  class="terminal-output"
                  role="img"
                  aria-label="Generated QR code as terminal text">
                  @for (row of terminalRows(); track $index) {
                    <div class="terminal-row">
                      @for (cell of row; track $index) {
                        <span
                          class="terminal-cell"
                          [attr.data-glyph]="cell.text[0]"
                          [style.width]="cell.text.length + 'ch'"
                          [style.--cell-foreground]="cell.foreground"
                          [style.background-color]="cell.background">
                          {{ cell.text }}
                        </span>
                      }
                    </div>
                  }
                </div>
                <pre
                  class="prompt prompt-ready"
                  aria-hidden="true"><span class="prompt-symbol">➜ </span><span class="prompt-directory">~ </span><span class="terminal-cursor"></span></pre>
              </div>
            </section>
          }
        }
      </div>
    }
  `,
})
export class CliPlaygroundPreview {
  private readonly nanostores = inject(NanostoresService);
  protected readonly options = toSignal(this.nanostores.useStore(cliPlaygroundOptions), {
    requireSync: true,
  });
  protected readonly preview = toSignal(this.nanostores.useStore(cliPreview), {requireSync: true});
  protected readonly terminalRows = computed(() => {
    const result = this.preview();
    return result?.state === 'ready' ? createTerminalRows(result.runs) : [];
  });

  constructor() {
    suppressInitialTransitions();
  }
}

/*
 * The encoder stages are not public API, so these workloads import the core source directly.
 * Renaming a stage function breaks this group, not the published packages.
 */
import {applyMaskToMatrix} from '../../../../core/src/matrix/apply-mask-to-matrix';
import {assembleQRCodeMatrix} from '../../../../core/src/matrix/assemble-matrix';
import {createBaseMatrix} from '../../../../core/src/matrix/create-base-matrix';
import {createQRCodeCodewords} from '../../../../core/src/matrix/create-qrcode-codewords';
import {evaluateMatrix} from '../../../../core/src/matrix/evaluate-matrix';
import {fillDataInMatrix} from '../../../../core/src/matrix/fill-data-in-matrix';
import {fillFormatInformationInMatrix} from '../../../../core/src/matrix/fill-format-information-in-matrix';
import {resolveQRCodeMatrixOptions} from '../../../../core/src/matrix/resolve-matrix-options';
import {ALPHANUMERIC_PAYLOADS, QR_VERSIONS, type WorkloadGroup, workload} from '../workload.ts';

function prepare(version: (typeof QR_VERSIONS)[number]) {
  const payload = ALPHANUMERIC_PAYLOADS[version];
  const options = {mask: 0, mode: 'alphanumeric', version} as const;
  const resolved = resolveQRCodeMatrixOptions(payload, options);
  const codewords = createQRCodeCodewords(resolved);
  const base = createBaseMatrix(version);
  return {payload, options, resolved, codewords, base, modules: base.modules.slice()};
}

export const group: WorkloadGroup = {
  id: 'matrix-stages',
  workloads: QR_VERSIONS.flatMap((version) => [
    workload({
      id: `stages/resolve-options-v${version}`,
      title: `Version ${version}: resolve options`,
      features: ['matrix'],
      setup: () => prepare(version),
      run: ({payload, options}) => resolveQRCodeMatrixOptions(payload, options),
    }),
    workload({
      id: `stages/codewords-v${version}`,
      title: `Version ${version}: codewords and error correction`,
      features: ['matrix'],
      setup: () => prepare(version),
      run: ({resolved}) => createQRCodeCodewords(resolved),
    }),
    workload({
      id: `stages/base-matrix-v${version}`,
      title: `Version ${version}: copy cached base matrix`,
      features: ['matrix'],
      run: () => createBaseMatrix(version).modules.slice(),
    }),
    workload({
      id: `stages/fill-data-v${version}`,
      title: `Version ${version}: fill data`,
      features: ['matrix'],
      setup: () => prepare(version),
      run: ({modules, base, codewords}) =>
        fillDataInMatrix(modules, base.roles, base.size, codewords),
    }),
    workload({
      id: `stages/apply-mask-v${version}`,
      title: `Version ${version}: apply mask`,
      features: ['matrix'],
      setup: () => prepare(version),
      run: ({modules, base}) => applyMaskToMatrix(modules, base.roles, base.size, 0),
    }),
    workload({
      id: `stages/evaluate-mask-v${version}`,
      title: `Version ${version}: score a mask`,
      features: ['matrix'],
      setup: () => prepare(version),
      run: ({modules, base}) => evaluateMatrix(modules, base.size),
    }),
    workload({
      id: `stages/fill-format-v${version}`,
      title: `Version ${version}: fill format information`,
      features: ['matrix'],
      setup: () => prepare(version),
      run: ({modules, base, resolved}) =>
        fillFormatInformationInMatrix(modules, base.size, resolved.errorCorrectionLevel, 0),
    }),
    workload({
      id: `stages/assemble-v${version}`,
      title: `Version ${version}: assemble matrix`,
      features: ['matrix'],
      setup: () => prepare(version),
      run: ({resolved, codewords}) =>
        assembleQRCodeMatrix(version, resolved.errorCorrectionLevel, codewords, 0),
    }),
  ]),
};

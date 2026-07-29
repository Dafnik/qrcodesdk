import type {QRCodeVersion} from '../types';
import {getQRCodeFormatInformationCoordinates} from './format-information';
import type {QRCodeMatrixModuleMetadata} from './metadata';
import {needsVersionInfo} from './needs-version-info';
import {VERSIONS} from './version-config';

type QRCodeFunctionalPatternMetadata = Pick<QRCodeMatrixModuleMetadata, 'role' | 'groupId'>;
type QRCodeFunctionalPatternGrid = (QRCodeFunctionalPatternMetadata | undefined)[][];

export function createQRCodeFunctionalPatternGrid(
  version: QRCodeVersion,
): QRCodeFunctionalPatternGrid {
  const size = version * 4 + 17;
  const grid: QRCodeFunctionalPatternGrid = Array.from({length: size}, () =>
    Array.from({length: size}),
  );

  placeFinder(grid, 0, 0, 'top-left');
  placeFinder(grid, 0, size - 7, 'top-right');
  placeFinder(grid, size - 7, 0, 'bottom-left');

  for (let index = 8; index <= size - 9; index++) {
    grid[6]![index] = {role: 'timing', groupId: 'timing'};
    grid[index]![6] = {role: 'timing', groupId: 'timing'};
  }

  const versionConfig = VERSIONS[version] ?? [[-100]];
  const alignmentPatterns = versionConfig[2]!;
  const patternCount = alignmentPatterns.length;
  for (let rowIndex = 0; rowIndex < patternCount; rowIndex++) {
    const minimumColumnIndex = rowIndex === 0 || rowIndex === patternCount - 1 ? 1 : 0;
    const maximumColumnIndex = rowIndex === 0 ? patternCount - 1 : patternCount;
    for (let columnIndex = minimumColumnIndex; columnIndex < maximumColumnIndex; columnIndex++) {
      const row = alignmentPatterns[rowIndex]!;
      const column = alignmentPatterns[columnIndex]!;
      fillRegion(grid, row, column, 5, 5, {
        role: 'alignment',
        groupId: `alignment:${row + 2}:${column + 2}`,
      });
    }
  }

  if (needsVersionInfo(version)) {
    fillRegion(grid, 0, size - 11, 6, 3, {role: 'version', groupId: 'version'});
    fillRegion(grid, size - 11, 0, 3, 6, {role: 'version', groupId: 'version'});
  }

  for (const [first, second] of getQRCodeFormatInformationCoordinates(size)) {
    grid[first[0]]![first[1]] = {role: 'format', groupId: 'format'};
    grid[second[0]]![second[1]] = {role: 'format', groupId: 'format'};
  }

  grid[size - 8]![8] = {role: 'dark-module', groupId: 'dark-module'};
  return grid;
}

function placeFinder(
  grid: QRCodeFunctionalPatternGrid,
  row: number,
  column: number,
  position: 'top-left' | 'top-right' | 'bottom-left',
): void {
  fillRegion(grid, row, column, 7, 7, {
    role: 'finder',
    groupId: `finder:${position}`,
  });

  const separatorCells =
    position === 'top-left'
      ? [
          ...Array.from({length: 8}, (_, index) => [7, index] as const),
          ...Array.from({length: 7}, (_, index) => [index, 7] as const),
        ]
      : position === 'top-right'
        ? [
            ...Array.from({length: 8}, (_, index) => [7, grid.length - 8 + index] as const),
            ...Array.from({length: 7}, (_, index) => [index, grid.length - 8] as const),
          ]
        : [
            ...Array.from({length: 8}, (_, index) => [grid.length - 8, index] as const),
            ...Array.from({length: 7}, (_, index) => [grid.length - 7 + index, 7] as const),
          ];

  for (const [separatorRow, separatorColumn] of separatorCells) {
    grid[separatorRow]![separatorColumn] = {
      role: 'separator',
      groupId: `separator:${position}`,
    };
  }
}

function fillRegion(
  grid: QRCodeFunctionalPatternGrid,
  row: number,
  column: number,
  height: number,
  width: number,
  cell: QRCodeFunctionalPatternMetadata,
): void {
  for (let rowOffset = 0; rowOffset < height; rowOffset++) {
    for (let columnOffset = 0; columnOffset < width; columnOffset++) {
      grid[row + rowOffset]![column + columnOffset] = cell;
    }
  }
}

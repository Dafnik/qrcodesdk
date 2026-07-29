export type QRCodeFormatInformationCoordinates = readonly [
  readonly [row: number, column: number],
  readonly [row: number, column: number],
];

export function getQRCodeFormatInformationCoordinates(
  size: number,
): readonly QRCodeFormatInformationCoordinates[] {
  const rows = [
    0,
    1,
    2,
    3,
    4,
    5,
    7,
    8,
    size - 7,
    size - 6,
    size - 5,
    size - 4,
    size - 3,
    size - 2,
    size - 1,
  ];
  const columns = [
    size - 1,
    size - 2,
    size - 3,
    size - 4,
    size - 5,
    size - 6,
    size - 7,
    size - 8,
    7,
    5,
    4,
    3,
    2,
    1,
    0,
  ];

  return rows.map((row, index) => [
    [row, 8],
    [8, columns[index]!],
  ]);
}

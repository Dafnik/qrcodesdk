/** Workload groups in report order. Each group is bundled and run on its own. */
export const WORKLOAD_GROUP_TITLES = {
  matrix: 'Matrix generation',
  'matrix-stages': 'Matrix encoder stages',
  modes: 'Modes and segmentation',
  symbols: 'Micro QR and rMQR',
  payload: 'Payload helpers',
  styling: 'Styling',
  renderers: 'SVG and text renderers',
  'raster-node': 'Node.js raster output and encoders',
  browser: 'Browser output',
  explain: 'Docs explanation',
} as const;

export type WorkloadGroupId = keyof typeof WORKLOAD_GROUP_TITLES;

export const WORKLOAD_GROUPS = Object.keys(WORKLOAD_GROUP_TITLES) as WorkloadGroupId[];

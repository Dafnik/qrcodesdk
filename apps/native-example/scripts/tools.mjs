import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

import {minute} from './process.mjs';

/** The app's ignored directory for pinned native test tools. */
export const tools = fileURLToPath(new URL('../.tools/', import.meta.url));
export const maestro = fileURLToPath(new URL('../.tools/maestro/bin/maestro', import.meta.url));
export const ccache = fileURLToPath(new URL('../.tools/bin/ccache', import.meta.url));

/** Download a pinned release archive and reject it unless its SHA-256 digest matches. */
export async function download(url, sha256) {
  const response = await fetch(url, {signal: AbortSignal.timeout(5 * minute)});
  if (!response.ok) throw new Error(`Unable to download ${url}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== sha256)
    throw new Error(`Checksum mismatch for ${url}`);
  return bytes;
}

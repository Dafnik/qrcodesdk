import {execFile} from 'node:child_process';
import process from 'node:process';
import {promisify} from 'node:util';

import {minute, runAsync} from './process.mjs';

const execFileAsync = promisify(execFile);

export async function bootIOS(signal) {
  // The first simctl call can take minutes while CoreSimulator mounts runtimes on a cold runner.
  // https://github.com/actions/runner-images/issues/15247
  const {stdout} = await execFileAsync(
    'xcrun',
    ['simctl', 'list', 'devices', 'available', '--json'],
    {
      signal,
      timeout: 5 * minute,
      killSignal: 'SIGKILL',
    },
  );
  const {devices} = JSON.parse(stdout);
  const phones = Object.values(devices)
    .flat()
    .filter((device) => device.name.startsWith('iPhone'));
  const requested = process.env.QRCODESDK_NATIVE_DEVICE;
  const device = requested
    ? phones.find((phone) => phone.udid === requested)
    : (phones.find((phone) => phone.state === 'Booted') ?? phones[0]);
  if (!device)
    throw new Error(
      'Install an iPhone simulator runtime in Xcode, or set QRCODESDK_NATIVE_DEVICE to an available iPhone UDID.',
    );
  if (device.state !== 'Booted') await runAsync('xcrun', ['simctl', 'boot', device.udid], {signal});
  await runAsync('xcrun', ['simctl', 'bootstatus', device.udid, '-b'], {signal});
  return device.udid;
}

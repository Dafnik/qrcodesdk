import process from 'node:process';

import {read, run} from './process.mjs';

export function bootIOS() {
  const {devices} = JSON.parse(read('xcrun', ['simctl', 'list', 'devices', 'available', '--json']));
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
  if (device.state !== 'Booted') run('xcrun', ['simctl', 'boot', device.udid]);
  run('xcrun', ['simctl', 'bootstatus', device.udid, '-b']);
  return device.udid;
}

import {qrcode} from '@qrcodesdk/core/matrix';
import {calendarPayload, vcardPayload, wifiPayload} from '@qrcodesdk/core/payload';

import {type WorkloadGroup, workload} from '../workload.ts';

const VCARD = {
  formattedName: 'Ada Lovelace',
  name: {familyName: 'Lovelace', givenName: 'Ada'},
  organization: 'Analytical Engines',
  phones: [{number: '+44 20 1234 5678'}],
  emails: [{address: 'ada@example.com'}],
  url: 'https://example.com',
};
const CALENDAR = {
  uid: 'perf-1@qrcodesdk.dev',
  timestamp: '2026-01-01T00:00:00Z',
  summary: 'Release review',
  location: 'Vienna',
  start: '2026-01-02T10:00:00Z',
  end: '2026-01-02T11:00:00Z',
};

export const group: WorkloadGroup = {
  id: 'payload',
  workloads: [
    workload({
      id: 'payload/wifi',
      title: 'Format a Wi-Fi payload',
      features: ['payload'],
      run: () => wifiPayload({ssid: 'Office; Guest', password: 'p@ss:word', encryption: 'WPA'}),
    }),
    workload({
      id: 'payload/vcard',
      title: 'Format a vCard',
      features: ['payload'],
      run: () => vcardPayload(VCARD),
    }),
    workload({
      id: 'payload/calendar',
      title: 'Format a calendar event',
      features: ['payload'],
      run: () => calendarPayload(CALENDAR),
    }),
    workload({
      id: 'payload/vcard-matrix',
      title: 'vCard to matrix',
      features: ['payload', 'matrix'],
      run: () => qrcode(vcardPayload(VCARD)).matrix(),
    }),
  ],
};

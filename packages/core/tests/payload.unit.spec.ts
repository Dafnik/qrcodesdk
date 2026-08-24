import {describe, expect, test} from 'vitest';

import {QRCodeError, emailPayload, geoPayload, phonePayload, smsPayload, wifiPayload} from '../src';

describe('payload serializers', () => {
  test('serializes RFC 6068 email payloads', () => {
    expect(
      emailPayload({
        to: ['first@example.com', 'hello+qr@example.com'],
        cc: 'copy@example.com',
        subject: 'Hello QR',
        body: 'Line one & two',
      }),
    ).toBe(
      'mailto:first@example.com,hello%2Bqr@example.com?cc=copy%40example.com&subject=Hello%20QR&body=Line%20one%20%26%20two',
    );
  });

  test('serializes RFC 3966 phone payloads', () => {
    expect(phonePayload({number: '+1-201-555-0123', extension: '456'})).toBe(
      'tel:+1-201-555-0123;ext=456',
    );
  });

  test('serializes RFC 5724 SMS payloads', () => {
    expect(smsPayload({recipients: ['+12015550123', '+12015550124'], body: 'Meet at 10?'})).toBe(
      'sms:+12015550123,+12015550124?body=Meet%20at%2010%3F',
    );
  });

  test('serializes RFC 5870 geo payloads', () => {
    expect(geoPayload({latitude: 48.2082, longitude: 16.3738})).toBe('geo:48.2082,16.3738');
    expect(geoPayload({latitude: 48.2, longitude: 16.3, altitude: 183, uncertainty: 10})).toBe(
      'geo:48.2,16.3,183;u=10',
    );
  });

  test('serializes escaped Wi-Fi payloads with useful encryption defaults', () => {
    expect(wifiPayload({ssid: 'Office;Guest', password: 'p:a\\ss', hidden: true})).toBe(
      'WIFI:T:WPA;S:Office\\;Guest;P:p\\:a\\\\ss;H:true;;',
    );
    expect(wifiPayload({ssid: 'Open network'})).toBe('WIFI:T:nopass;S:Open network;;');
  });

  test.each([
    () => emailPayload({to: []}),
    () => phonePayload({number: 'call me'}),
    () => smsPayload({recipients: []}),
    () => geoPayload({latitude: 91, longitude: 0}),
    () => wifiPayload({ssid: '', password: 'secret'}),
    () => wifiPayload({ssid: 'Open', encryption: 'nopass', password: 'secret'}),
  ])('reports invalid payload fields through QRCodeError', (serialize) => {
    expect(serialize).toThrow(QRCodeError);
    try {
      serialize();
    } catch (error) {
      expect(error).toMatchObject({code: 'INVALID_INPUT', details: {field: expect.any(String)}});
    }
  });
});

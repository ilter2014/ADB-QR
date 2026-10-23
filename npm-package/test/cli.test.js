'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {makePairingPayload, parseMdnsServices} = require('../lib/cli');
test('creates Android pairing payload', () => {
  assert.equal(makePairingPayload('Pixel_7','123456'),'WIFI:T:ADB;S:Pixel_7;P:123456;;');
});
test('rejects invalid payloads', () => {
  assert.throws(() => makePairingPayload('', '123456'), /service/i);
  assert.throws(() => makePairingPayload('Pixel;7','123456'), /service/i);
  assert.throws(() => makePairingPayload('Pixel_7','12;3456'), /code/i);
});
test('parses ADB mDNS rows', () => {
  const input = ['List', '_adb-tls-pairing._tcp 192.168.1.20:37123', '_adb-tls-connect._tcp 192.168.1.20:41211'].join(String.fromCharCode(10));
  assert.deepEqual(parseMdnsServices(input), [
    ['_adb-tls-pairing._tcp','192.168.1.20:37123'],
    ['_adb-tls-connect._tcp','192.168.1.20:41211']
  ]);
});

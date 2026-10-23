'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {makePairingPayload, parseMdnsServices, parseNamedMdnsServices} = require('../lib/cli');
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

test('pair --auto is accepted as an explicit automatic-discovery mode', async () => {
  const { main } = require('../lib/cli');
  const { spawnSync } = require('node:child_process');
  // Validate command-line help documents the auto mode without requiring a device.
  const help = spawnSync(process.execPath, [require.resolve('../bin/adb-qr.js'), '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /pair \[--auto\]/);
});

test('parses named pairing and connect mDNS services', () => {
  const input = [
    'studio-abcd _adb-tls-pairing._tcp. 192.168.1.20:37123',
    'adb-phone _adb-tls-connect._tcp 192.168.1.20:41211'
  ].join(String.fromCharCode(10));
  assert.deepEqual(parseNamedMdnsServices(input), [
    {instance:'studio-abcd', kind:'_adb-tls-pairing._tcp', endpoint:'192.168.1.20:37123'},
    {instance:'adb-phone', kind:'_adb-tls-connect._tcp', endpoint:'192.168.1.20:41211'}
  ]);
});
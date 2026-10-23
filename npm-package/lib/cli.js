'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const QRCode = require('qrcode');
const VERSION = require('../package.json').version;
const PAIR = '_adb-tls-pairing._tcp';
const CONNECT = '_adb-tls-connect._tcp';

function makePairingPayload(service, password) {
  if (!service || /[;\r\n]/.test(service)) throw new Error('Invalid or empty pairing service.');
  if (!password || /[;\r\n]/.test(password)) throw new Error('Invalid or empty pairing code.');
  return 'WIFI:T:ADB;S:' + service + ';P:' + password + ';;';
}
function parseMdnsServices(output) {
  const rows = [];
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/(_adb-tls-(?:pairing|connect)\._tcp)\.?\s+(\S+)/);
    if (match) rows.push([match[1], match[2]]);
  }
  return rows;
}
function runAdb(adb, args, timeout = 30000) {
  const result = spawnSync(adb, args, {encoding:'utf8', timeout, windowsHide:true, shell:false});
  if (result.error) {
    if (result.error.code === 'ENOENT') throw new Error('ADB not found. Install Android Platform-Tools or pass --adb <path-to-adb.exe>.');
    if (result.error.code === 'ETIMEDOUT') throw new Error('ADB command timed out.');
    throw new Error('Could not start ADB: ' + result.error.message);
  }
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  if (result.status !== 0) throw new Error(output || ('ADB exited with status ' + result.status + '.'));
  return output;
}
function help() {
  return 'ADB-QR ' + VERSION + ' — wireless Android ADB helper\n\n' +
    'Usage: adb-qr [--adb <path>] <command>\n\n' +
    '  qr --service <name> --password <code> [--output <directory>]\n' +
    '  pair                       Discover, pair, then connect via ADB mDNS\n' +
    '  devices                    List connected devices\n' +
    '  connect HOST:PORT           Connect to a wireless endpoint\n' +
    '  disconnect HOST:PORT        Disconnect an endpoint\n' +
    '  disconnect --all            Disconnect all network devices\n' +
    '  --help                      Show help\n  --version                   Show version\n\n' +
    'Requires Node.js 18+ and Android SDK Platform-Tools (adb).\n';
}
async function main(argv = []) {
  try {
    const args = [...argv];
    let adb = process.env.ADB || 'adb';
    const ai = args.indexOf('--adb');
    if (ai >= 0) {
      if (!args[ai + 1]) throw new Error('--adb requires a path or command name.');
      adb = args[ai + 1]; args.splice(ai, 2);
    }
    const command = args.shift();
    if (!command || ['--help','-h','help'].includes(command)) { stdout.write(help()); return 0; }
    if (command === '--version' || command === '-v') { console.log(VERSION); return 0; }
    if (command === 'qr') {
      let service, password, dir = process.cwd();
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--service') service = args[++i];
        else if (args[i] === '--password') password = args[++i];
        else if (args[i] === '--output') dir = path.resolve(args[++i] || '');
        else throw new Error('Unknown QR option: ' + args[i]);
      }
      const payload = makePairingPayload(service, password);
      fs.mkdirSync(dir, {recursive:true});
      const file = path.join(dir, 'adb-qr.png');
      await QRCode.toFile(file, payload, {errorCorrectionLevel:'M', margin:4, width:400});
      console.log('QR image saved to: ' + file);
      console.log('Treat this image as a credential; do not share or commit it.');
      return 0;
    }
    if (command === 'pair') {
      if (args.length) throw new Error('pair takes no additional arguments.');
      let services = parseMdnsServices(runAdb(adb, ['mdns','services']));
      const endpoint = (services.find(row => row[0] === PAIR) || [])[1];
      if (!endpoint) throw new Error('No pairing service found. Open Android Wireless debugging > Pair device with QR code, then try again.');
      const split = endpoint.lastIndexOf(':');
      const port = endpoint.slice(split + 1);
      if (split < 1 || !/^\d+$/.test(port)) throw new Error('Unexpected ADB pairing endpoint: ' + endpoint);
      const rl = readline.createInterface({input:stdin, output:stdout});
      let code;
      try { code = (await rl.question('Pairing code shown on Android: ')).trim(); } finally { rl.close(); }
      if (!code) throw new Error('Pairing code cannot be empty.');
      console.log('Pairing with ' + endpoint + ' ...');
      console.log(runAdb(adb, ['pair', endpoint, code]));
      services = parseMdnsServices(runAdb(adb, ['mdns','services']));
      const target = (services.find(row => row[0] === CONNECT) || [])[1];
      if (target) { console.log('Connecting to ' + target + ' ...'); console.log(runAdb(adb, ['connect', target])); }
      else console.log('Paired, but no connect service was found. Use adb-qr connect HOST:PORT.');
      return 0;
    }
    if (command === 'devices') {
      if (args.length) throw new Error('devices takes no additional arguments.');
      console.log(runAdb(adb, ['devices','-l'])); return 0;
    }
    if (command === 'connect') {
      if (args.length !== 1 || !args[0] || /\s/.test(args[0]) || !args[0].includes(':')) throw new Error('Usage: adb-qr connect HOST:PORT');
      console.log(runAdb(adb, ['connect', args[0]])); return 0;
    }
    if (command === 'disconnect') {
      if (args.length === 1 && args[0] === '--all') {
        const output = runAdb(adb, ['devices']);
        const endpoints = output.split(/\r?\n/).slice(1).map(line => line.trim().split(/\s+/))
          .filter(parts => parts.length >= 2 && parts[1] === 'device' && parts[0].includes(':')).map(parts => parts[0]);
        if (!endpoints.length) { console.log('No connected network ADB devices found.'); return 0; }
        for (const endpoint of endpoints) console.log(runAdb(adb, ['disconnect', endpoint]));
        return 0;
      }
      if (args.length !== 1 || !args[0] || /\s/.test(args[0]) || !args[0].includes(':')) throw new Error('Usage: adb-qr disconnect HOST:PORT | adb-qr disconnect --all');
      console.log(runAdb(adb, ['disconnect', args[0]])); return 0;
    }
    throw new Error('Unknown command: ' + command + '\n\n' + help());
  } catch (error) {
    console.error('Error: ' + (error.message || error));
    return 2;
  }
}
module.exports = {main, makePairingPayload, parseMdnsServices, runAdb};

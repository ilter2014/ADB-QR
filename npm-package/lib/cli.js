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
function parseNamedMdnsServices(output) {
  const rows = [];
  for (const line of output.split(/\r?\n/)) {
    const match = line.trim().match(/^(\S+)\s+(_adb-tls-(?:pairing|connect)\._tcp)\.?\s+(\S+)$/);
    if (match) rows.push({instance:match[1], kind:match[2], endpoint:match[3]});
  }
  return rows;
}function runAdb(adb, args, timeout = 30000) {
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
  return 'ADB-QR ' + VERSION + ' â€” wireless Android ADB helper\n\n' +
    'Usage: adb-qr [--adb <path>] <command>\n\n' +
    '  qr --service <name> --password <code> [--output <directory>]\n' +
    '  scan                       Discover wireless-debugging services\n' +
    '  pair [--auto]              Discover, pair, then connect via ADB mDNS\n' +
    '  devices                    List connected devices\n' +
    '  connect HOST:PORT           Connect to a wireless endpoint\n' +
    '  disconnect HOST:PORT        Disconnect an endpoint\n' +
    '  disconnect --all            Disconnect all network devices\n' +
    '  --help                      Show help\n  --version                   Show version\n\n' +
    'Requires Node.js 18+ and Android SDK Platform-Tools (adb).\n';
}
async function panel(adb = process.env.ADB || 'adb') {
  const choices = {
    '1': ['pair'],
    '2': ['pair', '--auto'],
    '3': ['scan'],
    '4': ['devices'],
    '5': ['connect'],
    '6': ['disconnect', '--all'],
    '7': ['--help']
  };
  const ask = async (question) => {
    const rl = readline.createInterface({input:stdin, output:stdout});
    try { return await rl.question(question); } finally { rl.close(); }
  };

  while (true) {
    stdout.write('\n');
    stdout.write('╔══════════════════════════════════════════════╗\n');
    stdout.write('║                 ADB-QR PANEL                ║\n');
    stdout.write('║        Android Wireless Debugging           ║\n');
    stdout.write('╚══════════════════════════════════════════════╝\n');
    stdout.write('  1. QR koduyla yeni telefon eşleştir\n');
    stdout.write('  2. Android koduyla eşleştir (otomatik keşif)\n');
    stdout.write('  3. Kablosuz ADB servislerini tara\n');
    stdout.write('  4. Bağlı cihazları göster\n');
    stdout.write('  5. HOST:PORT adresine bağlan\n');
    stdout.write('  6. Tüm kablosuz bağlantıları kes\n');
    stdout.write('  7. Komut yardımını göster\n');
    stdout.write('  0. Çıkış\n\n');
    const choice = (await ask('  Seçimin: ')).trim();
    if (choice === '0' || choice.toLowerCase() === 'q') return 0;
    const command = choices[choice];
    if (!command) {
      stdout.write('\nGeçersiz seçim. 0-7 arasında bir seçenek gir.\n');
      await ask('Devam etmek için Enter...');
      continue;
    }

    let args = [...command];
    if (choice === '5') {
      const endpoint = (await ask('  Cihaz adresi (HOST:PORT): ')).trim();
      if (!endpoint) continue;
      args = ['connect', endpoint];
    }
    const code = await main(['--adb', adb, ...args]);
    if (code !== 0) stdout.write('\nİşlem tamamlanamadı (kod ' + code + ').\n');
    if (choice !== '7') await ask('\nPanele dönmek için Enter...');
  }
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
    if (!command) return await panel(adb);
    if (['--help','-h','help'].includes(command)) { stdout.write(help()); return 0; }
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
    if (command === 'scan') {
      if (args.length) throw new Error('Usage: adb-qr scan');
      const services = parseMdnsServices(runAdb(adb, ['mdns','services']));
      if (!services.length) {
        console.log('No Android wireless-debugging services discovered via mDNS.');
        console.log('Check that Wireless debugging is enabled and both devices use the same Wi-Fi network.');
        return 1;
      }
      console.log('Discovered Android wireless-debugging services:');
      for (const [service, endpoint] of services) {
        const kind = service === PAIR ? 'pairing service (pairing code required)' : 'connection service (may require prior pairing)';
        console.log('  ' + kind + ': ' + endpoint);
      }
      return 0;
    }    if (command === 'pair') {
      if (args.some(arg => arg !== '--auto')) throw new Error('Usage: adb-qr pair [--auto]');
      if (args.includes('--auto')) {
        let services = parseMdnsServices(runAdb(adb, ['mdns','services']));
        const endpoint = (services.find(row => row[0] === PAIR) || [])[1];
        if (!endpoint) throw new Error('No pairing service found. Open Android Wireless debugging > Pair device with pairing code, then retry.');
        const rl = readline.createInterface({input:stdin, output:stdout});
        let code;
        try { code = (await rl.question('Pairing code shown on Android: ')).trim(); } finally { rl.close(); }
        if (!code) throw new Error('Pairing code cannot be empty.');
        console.log(runAdb(adb, ['pair', endpoint, code]));
        services = parseMdnsServices(runAdb(adb, ['mdns','services']));
        const target = (services.find(row => row[0] === CONNECT) || [])[1];
        if (target) console.log(runAdb(adb, ['connect', target]));
        return 0;
      }
      const service = 'studio-' + require('node:crypto').randomBytes(8).toString('hex');
      const password = require('node:crypto').randomBytes(6).toString('base64url').slice(0, 10);
      const payload = makePairingPayload(service, password);
      const dir = path.join(require('node:os').tmpdir(), 'adb-qr-' + process.pid);
      fs.mkdirSync(dir, {recursive:true});
      const file = path.join(dir, 'adb-qr.png');
      await QRCode.toFile(file, payload, {errorCorrectionLevel:'M', margin:4, width:500});
      console.log('ADB-QR pairing QR created: ' + file);
      console.log('On Android, open Developer options > Wireless debugging > Pair device with QR code.');
      console.log('Scanning the QR with your PHONE is expected. This app never opens the PC webcam.');
      const opener = spawnSync('cmd.exe', ['/c','start','','"' + file + '"'], {encoding:'utf8', windowsHide:true, shell:false});
      if (opener.error) console.log('Open the PNG manually: ' + file);
      console.log('Waiting up to 120 seconds for the phone to scan the QR...');
      const deadline = Date.now() + 120000;
      let endpoint;
      while (Date.now() < deadline) {
        const output = runAdb(adb, ['mdns','services']);
        const rows = parseNamedMdnsServices(output);
        const match = rows.find(row => row.instance === service && row.kind === PAIR);
        if (match) { endpoint = match.endpoint; break; }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!endpoint) throw new Error('Pairing service not detected before timeout. Check same Wi-Fi, Android Wireless debugging, and Windows Firewall.');
      console.log('Phone detected at ' + endpoint + '; pairing...');
      console.log(runAdb(adb, ['pair', endpoint, password]));
      const host = endpoint.slice(0, endpoint.lastIndexOf(':'));
      const connectDeadline = Date.now() + 30000;
      let target;
      while (Date.now() < connectDeadline) {
        const rows = parseNamedMdnsServices(runAdb(adb, ['mdns','services']));
        const match = rows.find(row => row.kind === CONNECT && row.endpoint.startsWith(host + ':'));
        if (match) { target = match.endpoint; break; }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!target) throw new Error('Phone paired, but no connect service was discovered. Check Wireless debugging on Android.');
      console.log('Connecting to ' + target + ' ...');
      console.log(runAdb(adb, ['connect', target]));
      console.log(runAdb(adb, ['devices','-l']));
      return 0;
    }    if (command === 'devices') {
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
module.exports = {main, makePairingPayload, parseMdnsServices, parseNamedMdnsServices, runAdb};

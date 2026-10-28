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
  return 'ADB-QR ' + VERSION + '— wireless Android ADB helper\n\n' +
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
  const ask = async (question) => {
    const rl = readline.createInterface({input:stdin, output:stdout});
    try { return await rl.question(question); } finally { rl.close(); }
  };
  const pause = () => ask('\nPanele dönmek için Enter...');
  while (true) {
    stdout.write('\x1b[2J\x1b[H');
    stdout.write('╔════════════════════════════════════════════════════════════════════════════╗\n');
    stdout.write('║                         A D B  •  Q R                                     ║\n');
    stdout.write('║                    ANDROID WIRELESS CONNECT                               ║\n');
    stdout.write('╚════════════════════════════════════════════════════════════════════════════╝\n\n');
    let adbReady = false;
    try { runAdb(adb, ['version'], 5000); adbReady = true; } catch (_) {}
    stdout.write('  ' + (adbReady ? 'ADB durumu: Hazır' : 'ADB durumu: Bulunamadı — Platform-Tools kur ve PATH ayarını kontrol et') + '\n\n');
    stdout.write('  ╭───────────────┐     ╭──────────────────┐\n');
    stdout.write('  │  [1] QR EŞLEŞTİR │     │  [2] AĞDAN BAĞLAN │\n');
    stdout.write('  ╰───────────────┘     ╰──────────────────┘\n\n');
    stdout.write('  [3] Bağlı cihazları göster\n');
    stdout.write('  [4] Tüm bağlantıları kes\n');
    stdout.write('  [0] Çıkış\n\n');
    const choice = (await ask("  Seçimini yaz ve Enter'a bas  › ")).trim().toLowerCase();
    if (['0','q','exit'].includes(choice)) {
      stdout.write('\nADB-QR kapatıldı. Görüşürüz!\n');
      return 0;
    }
    if (!adbReady) {
      stdout.write('\nADB bulunamadı. Android SDK Platform-Tools kurulu ve PATH üzerinde olmalı.\n');
      await pause();
      continue;
    }
    if (choice === '1') {
      await main(['--adb', adb, 'pair']);
      await pause();
    } else if (choice === '2') {
      try {
        const rows = parseNamedMdnsServices(runAdb(adb, ['mdns','services']));
        const items = rows.filter(row => row.kind === CONNECT);
        if (!items.length) {
          stdout.write('\nŞu anda ağda bağlantı servisi bulunamadı.\n');
          stdout.write('Yeni telefon eklemek için [1] QR eşleştirmesini kullan.\n');
        } else {
          stdout.write('\nAĞDA BULUNAN ADB CİHAZLARI\n');
          items.forEach((item, i) => stdout.write('  [' + (i + 1) + '] ' + item.instance + '  ' + item.endpoint + '\n'));
          stdout.write('  [0] Geri\n');
          const selected = (await ask('\n  Bağlanılacak cihaz: ')).trim();
          if (selected !== '0' && /^\d+$/.test(selected) && Number(selected) >= 1 && Number(selected) <= items.length) {
            stdout.write('\n' + runAdb(adb, ['connect', items[Number(selected) - 1].endpoint]) + '\n');
            stdout.write(runAdb(adb, ['devices','-l']) + '\n');
          } else if (selected !== '0') stdout.write('Geçersiz seçim.\n');
        }
      } catch (error) { stdout.write('\nHATA: ' + error.message + '\n'); }
      await pause();
    } else if (choice === '3') {
      try { stdout.write('\nBAĞLI ADB CİHAZLARI\n' + runAdb(adb, ['devices','-l']) + '\n'); }
      catch (error) { stdout.write('\nHATA: ' + error.message + '\n'); }
      await pause();
    } else if (choice === '4') {
      const confirm = (await ask('Tüm kablosuz ADB bağlantıları kesilsin mi? (E/H): ')).trim().toLowerCase();
      if (confirm === 'e' || confirm === 'evet') {
        try {
          const output = runAdb(adb, ['devices']);
          const endpoints = output.split(/\r?\n/).slice(1).map(line => line.trim().split(/\s+/))
            .filter(parts => parts.length >= 2 && parts[1] === 'device' && parts[0].includes(':')).map(parts => parts[0]);
          if (!endpoints.length) stdout.write('Kesilecek kablosuz bağlantı bulunamadı.\n');
          for (const endpoint of endpoints) stdout.write(runAdb(adb, ['disconnect', endpoint]) + '\n');
        } catch (error) { stdout.write('\nHATA: ' + error.message + '\n'); }
      }
      await pause();
    } else {
      stdout.write('\nGeçersiz seçim.\n');
      await pause();
    }
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
      stdout.write('\n  YENİ TELEFON EŞLEŞTİR\n');
      stdout.write('  1. Telefon ve bilgisayar aynı Wi-Fi ağına bağlı olsun.\n');
      stdout.write('  2. Android: Geliştirici seçenekleri > Kablosuz hata ayıklama\n');
      stdout.write("  3. 'QR koduyla cihaz eşleştir' ekranını aç.\n\n");
      const promptRl = readline.createInterface({input:stdin, output:stdout});
      try { await promptRl.question('  Hazır olduğunda Enter\'a bas; QR kodu oluşturulsun...'); } finally { promptRl.close(); }
      const service = 'studio-' + require('node:crypto').randomBytes(8).toString('hex');
      const password = require('node:crypto').randomBytes(6).toString('base64url').slice(0, 10);
      const payload = makePairingPayload(service, password);
      const dir = path.join(require('node:os').tmpdir(), 'adb-qr-' + process.pid);
      fs.mkdirSync(dir, {recursive:true});
      const file = path.join(dir, 'adb-qr.png');
      await QRCode.toFile(file, payload, {errorCorrectionLevel:'M', margin:4, width:500});
      console.log('\n  ADB-QR | PNG KODU HAZIR');
      console.log('  ──────────────────────────────────────────────────────');
      console.log('  Dosya: ' + file);
      console.log('  Geçerlilik: 5 dakika');
      console.log('\n  Telefonda Kablosuz hata ayıklama > QR koduyla cihaz eşleştir');
      console.log('  ekranını açıp bu PNG dosyasını tara.\n');
      console.log('  Tarama bekleniyor. Bu pencereyi kapatma; işlem taramadan');
      console.log('  sonra eşleştirip telefonu otomatik bağlamaya çalışacak.');
      console.log('  İptal etmek için Ctrl+C.');
      const deadline = Date.now() + 300000;
      let endpoint;
      while (Date.now() < deadline) {
        const output = runAdb(adb, ['mdns','services']);
        const rows = parseNamedMdnsServices(output);
        const match = rows.find(row => row.instance === service && row.kind === PAIR);
        if (match) { endpoint = match.endpoint; break; }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!endpoint) {
        try { fs.unlinkSync(file); } catch (_) {}
        throw new Error('Süre doldu. QR artık bu oturum için geçerli değil. Aynı Wi-Fi ağını, Kablosuz hata ayıklamayı ve Windows Güvenlik Duvarı ayarlarını kontrol et.');
      }
      console.log('\n  ✓ Telefon bulundu: ' + endpoint);
      const pairedOutput = runAdb(adb, ['pair', endpoint, password]);
      console.log(pairedOutput);
      if (!pairedOutput.includes('Successfully paired')) {
        try { fs.unlinkSync(file); } catch (_) {}
        throw new Error('Eşleştirme başarısız.');
      }
      try {
        fs.unlinkSync(file);
        console.log('  QR PNG dosyası kullanıldı ve kaldırıldı.');
      } catch (_) {}
      console.log('\n  ✓ Eşleştirildi. Telefonun ADB bağlantısı aranıyor...');
      const host = endpoint.slice(0, endpoint.lastIndexOf(':'));
      const connectDeadline = Date.now() + 30000;
      let target;
      while (Date.now() < connectDeadline) {
        const rows = parseNamedMdnsServices(runAdb(adb, ['mdns','services']));
        const match = rows.find(row => row.kind === CONNECT && row.endpoint.startsWith(host + ':'));
        if (match) { target = match.endpoint; break; }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!target) {
        console.log('  ! Eşleştirme tamamlandı fakat bağlantı servisi bulunamadı.');
        console.log(runAdb(adb, ['devices','-l']));
        return 1;
      }
      console.log('Connecting to ' + target + ' ...');
      const connectOutput = runAdb(adb, ['connect', target]);
      console.log(connectOutput);
      console.log(runAdb(adb, ['devices','-l']));
      if (/connected to|already connected/i.test(connectOutput)) {
        console.log('  ✓ TELEFON BAĞLANDI!');
        return 0;
      }
      console.log('  ! Otomatik bağlantı doğrulanamadı.');
      return 1;
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

'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const os = require('node:os');
const QRCode = require('qrcode');
const { runAdb, parseNamedMdnsServices, makePairingPayload } = require('./cli');
const VERSION = require('../package.json').version;
const CONNECT = '_adb-tls-connect._tcp';
const PAIR = '_adb-tls-pairing._tcp';
let pairState = { active:false, done:false, ok:false, message:'' };
let pairGeneration = 0;
function send(res,status,data){const body=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(body);}
function bodyOf(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>100000)reject(Error('Request too large'));});req.on('end',()=>{try{resolve(s?JSON.parse(s):{});}catch{reject(Error('Invalid JSON'));}});});}
function devices(adb){return runAdb(adb,['devices','-l']).split(/\r?\n/).slice(1).map(s=>s.trim()).filter(Boolean).map(line=>{const p=line.split(/\s+/);return {serial:p[0],state:p[1]||'unknown',name:(line.match(/model:(\S+)/)||[])[1]||p[0]};});}
function launch(adb='adb'){
 const html=fs.readFileSync(path.join(__dirname,'gui.html'),'utf8');
 const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1');
  if(req.method==='GET'&&u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return;}
  if(req.method==='GET'&&u.pathname==='/api/status'){let ready=false;try{runAdb(adb,['version'],5000);ready=true;}catch{}const networkConnected=Object.values(os.networkInterfaces()).flat().some(i=>i&&!i.internal&&i.family==='IPv4'&&!i.address.startsWith('169.254.'));send(res,200,{ready,networkConnected,version:VERSION});return;}
  if(req.method==='GET'&&u.pathname==='/api/devices'){try{send(res,200,{devices:devices(adb)});}catch(e){send(res,500,{error:e.message});}return;}
  if(req.method==='GET'&&u.pathname==='/api/pair/status'){send(res,200,pairState);return;}
  if(req.method!=='POST'){send(res,404,{error:'Not found'});return;}
  let b;try{b=await bodyOf(req);}catch(e){send(res,400,{error:e.message});return;}
  try{
   if(u.pathname==='/api/exit'){if(!b.confirm)throw Error('Exit was not confirmed');pairGeneration++;pairState.active=false;send(res,200,{message:'ADB-QR closed.'});setTimeout(()=>server.close(()=>process.exit(0)),200);return;}
   if(u.pathname==='/api/pair/cancel'){pairGeneration++;pairState={active:false,done:false,ok:false,message:'Previous QR and pairing session discarded.'};send(res,200,{cancelled:true});return;}
   if(u.pathname==='/api/pair'){
    if(pairState.active)throw Error('Pairing is already in progress.');
    const generation=++pairGeneration;
    const service='studio-'+crypto.randomBytes(8).toString('hex'),password=crypto.randomBytes(6).toString('base64url').slice(0,10);
    const qr=await QRCode.toDataURL(makePairingPayload(service,password),{errorCorrectionLevel:'M',margin:2,width:320});
    pairState={active:true,done:false,ok:false,message:'Waiting for your phone to scan the QR code.'};
    (async()=>{try{
     let match;for(let i=0;i<120&&pairState.active&&generation===pairGeneration;i++){match=parseNamedMdnsServices(runAdb(adb,['mdns','services'])).find(x=>x.instance===service&&x.kind===PAIR);if(match)break;await new Promise(r=>setTimeout(r,1000));}
     if(generation!==pairGeneration)return;
     if(!match)throw Error('Timed out. Check Wireless debugging, shared Wi-Fi, and the Windows firewall.');
     pairState.message='Phone found. Completing secure pairing…';
     const paired=runAdb(adb,['pair',match.endpoint,password]);if(!/Successfully paired/i.test(paired))throw Error(paired||'Pairing failed.');
     if(generation!==pairGeneration)return;
     pairState.message='Paired. Searching for the connection service…';
     const host=match.endpoint.slice(0,match.endpoint.lastIndexOf(':'));let target;
     for(let i=0;i<30&&generation===pairGeneration;i++){target=parseNamedMdnsServices(runAdb(adb,['mdns','services'])).find(x=>x.kind===CONNECT&&x.endpoint.startsWith(host+':'));if(target)break;await new Promise(r=>setTimeout(r,1000));}
     if(generation!==pairGeneration)return;
     if(!target)throw Error('Pairing succeeded, but no connection service was found.');
     const out=runAdb(adb,['connect',target.endpoint]);pairState.ok=/connected to|already connected/i.test(out);pairState.message=pairState.ok?'Phone paired and connected successfully.':out;
    }catch(e){if(generation===pairGeneration){pairState.ok=false;pairState.message=e.message;}}finally{if(generation===pairGeneration){pairState.active=false;pairState.done=true;}}})();
    send(res,200,{qr});return;
   }
   if(u.pathname==='/api/network'){const list=parseNamedMdnsServices(runAdb(adb,['mdns','services'])).filter(x=>x.kind===CONNECT);send(res,200,{devices:list});return;}
   if(u.pathname==='/api/connect'){if(typeof b.endpoint!=='string'||!/^[\w.:-]+$/.test(b.endpoint)||!b.endpoint.includes(':'))throw Error('Invalid endpoint');send(res,200,{output:runAdb(adb,['connect',b.endpoint])});return;}
   if(u.pathname==='/api/disconnect'){if(!b.all)throw Error('Invalid request');const list=devices(adb).filter(x=>x.state==='device'&&x.serial.includes(':'));const out=list.map(x=>runAdb(adb,['disconnect',x.serial]));send(res,200,{output:out.join('\n')||'No wireless connections to disconnect.'});return;}
   send(res,404,{error:'Not found'});
  }catch(e){send(res,500,{error:e.message||String(e)});}
 });
 server.listen(0,'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port;console.log('ADB-QR graphical UI: '+url);const child=spawn('cmd.exe',['/d','/s','/c','start','""',url],{detached:true,stdio:'ignore',windowsHide:true});child.unref();});
 server.on('error',e=>{console.error('Could not start ADB-QR UI: '+e.message);process.exitCode=1;});
}
module.exports={launch};

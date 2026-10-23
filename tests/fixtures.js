const base=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
async function start(root,port=0){
 const child=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:String(port),WORLDFORGE_DATA_DIR:root},stdio:['ignore','pipe','pipe']});
 let output='',errors='';child.stderr.on('data',c=>errors+=c);
 const url=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.kill();reject(new Error('Server startup timeout: '+errors));},15000);child.once('error',e=>{clearTimeout(timeout);reject(e);});child.once('exit',()=>{clearTimeout(timeout);reject(new Error(errors));});child.stdout.on('data',c=>{output+=c;const match=output.match(/http:\/\/localhost:(\d+)/);if(match){clearTimeout(timeout);resolve(`http://127.0.0.1:${match[1]}`);}});});
 return {child,url,stop:()=>new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)return resolve();child.once('exit',resolve);child.kill();})};
}
const test=base.test.extend({
 library:async({},use)=>{const root=await fs.mkdtemp(path.join(os.tmpdir(),'worldforge-test-'));let server=await start(root);try{await use({root,url:server.url,restart:async()=>{const port=new URL(server.url).port;await server.stop();server=await start(root,port);}});}finally{await server.stop();await fs.rm(root,{recursive:true,force:true});}},
 baseURL:async({library},use)=>use(library.url),
});
async function manifest(file){const yauzl=require('yauzl');return new Promise((resolve,reject)=>yauzl.open(file,{lazyEntries:true},(e,zip)=>{if(e)return reject(e);zip.on('error',reject);zip.on('entry',entry=>{if(entry.fileName!=='manifest.json')return zip.readEntry();zip.openReadStream(entry,(e,s)=>{if(e)return reject(e);let data='';s.on('data',c=>data+=c);s.on('error',reject);s.on('end',()=>{zip.close();try{resolve(JSON.parse(data));}catch(e){reject(e);}});});});zip.readEntry();}));}
module.exports={test,expect:base.expect,manifest};

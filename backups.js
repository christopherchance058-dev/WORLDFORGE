'use strict';
const fs=require('node:fs');
const fsp=fs.promises;
const path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const {ZipArchive}=require('archiver');
const yauzl=require('yauzl');
const {pipeline}=require('node:stream/promises');
const {normalizeState,imageRecords,fail,receive,validateState,IMAGE_ID,IMAGE_URL,IMAGE_LIMIT,JSON_LIMIT,formats}=require('./storage');
const backupGB=Number(process.env.WORLDFORGE_BACKUP_LIMIT_GB||1024);
if(!Number.isFinite(backupGB)||backupGB<=0||backupGB>100000)throw new Error('WORLDFORGE_BACKUP_LIMIT_GB must be between 0 and 100000.');
const ARCHIVE_LIMIT=backupGB*1024*1024*1024;
async function exportZip(store,destination,world){
  const manifest={...(world?{world}:{}),format:'worldforge',version:6,exportedAt:new Date().toISOString(),...store.state(),images:store.imageList(),migrations:store.db.prepare('SELECT hash FROM migrations').all().map(r=>r.hash)};
  // Immutable image files allow a consistent records snapshot without copying blobs into RAM.
  for(const image of manifest.images)await fsp.access(path.join(store.images,image.filename));
  const zip=new ZipArchive({zlib:{level:0},forceZip64:true});
  zip.on('warning',error=>zip.destroy(error));
  const completion=pipeline(zip,destination);
  zip.append(JSON.stringify(manifest),{name:'manifest.json'});
  for(const image of manifest.images)zip.file(path.join(store.images,image.filename),{name:`images/${image.filename}`,store:true});
  zip.finalize().catch(e=>zip.destroy(e));
  await completion;
}
async function checkpoint(store,reason,world){
  const filename=`${new Date().toISOString().replaceAll(':','-')}-${reason}-${randomUUID()}.zip`;
  const target=path.join(store.backups,filename), temp=target+'.partial';
  try{await exportZip(store,fs.createWriteStream(temp,{flags:'wx',mode:0o600}),world);await fsp.rename(temp,target);return filename;}
  catch(e){await fsp.rm(temp,{force:true});throw e;}
}
// Verify our completed checkpoint without copying image files or loading them into RAM.
async function verifyCheckpoint(store,filename,world){
  const expected=store.state(),images=store.imageList(),byPath=new Map(images.map(i=>[`images/${i.filename}`,i]));
  const zip=await new Promise((resolve,reject)=>yauzl.open(path.join(store.backups,filename),{lazyEntries:true},(e,z)=>e?reject(e):resolve(z)));
  return new Promise((resolve,reject)=>{
    const seen=new Set();let stopped=false,manifestSeen=false;
    const stop=e=>{if(stopped)return;stopped=true;zip.close();reject(e);};zip.on('error',stop);
    zip.on('end',()=>{if(stopped)return;if(!manifestSeen||seen.size!==images.length+1)return stop(Object.assign(new Error('The deletion backup is incomplete. Your world was not moved to Trash.'),{status:400}));resolve(true);});
    zip.on('entry',entry=>{(async()=>{
      const name=entry.fileName;if(seen.has(name)||(name!=='manifest.json'&&!byPath.has(name)))fail('The deletion backup contains unexpected files. Your world was not moved to Trash.');seen.add(name);
      const limit=name==='manifest.json'?JSON_LIMIT:IMAGE_LIMIT;if(entry.uncompressedSize>limit)fail('The deletion backup exceeds the supported size.');
      const stream=await new Promise((resolve,reject)=>zip.openReadStream(entry,(e,s)=>e?reject(e):resolve(s)));let bytes=0;const hash=createHash('sha256'),chunks=[];
      for await(const chunk of stream){bytes+=chunk.length;if(bytes>limit)fail('The deletion backup exceeds the supported size.');if(name==='manifest.json')chunks.push(chunk);else hash.update(chunk);}
      if(name==='manifest.json'){const manifest=JSON.parse(Buffer.concat(chunks).toString('utf8'));validateState(manifest);if(manifest.format!=='worldforge'||Object.entries(expected).some(([key,value])=>JSON.stringify(manifest[key])!==JSON.stringify(value))||JSON.stringify(manifest.images)!==JSON.stringify(images)||(world&&JSON.stringify(manifest.world)!==JSON.stringify(world)))fail('The deletion backup did not match your world. Nothing was deleted.');manifestSeen=true;}
      else{const image=byPath.get(name);if(bytes!==image.bytes||hash.digest('hex')!==image.sha256)fail('An image failed the deletion backup check. Your world was not moved to Trash.');}
      zip.readEntry();
    })().catch(stop);});zip.readEntry();
  });
}
async function unpack(file,directory){
  const zip=await new Promise((resolve,reject)=>yauzl.open(file,{lazyEntries:true,autoClose:true},(e,z)=>e?reject(Object.assign(e,{status:400})):resolve(z)));
  return new Promise((resolve,reject)=>{
    const extracted=new Map();let total=0,stopped=false;
    const stop=e=>{if(stopped)return;stopped=true;zip.close();if(!e.status&&!e.code){e.status=400;e.message='The backup ZIP is malformed or contains unsafe paths: '+e.message;}reject(e);};
    zip.on('error',stop);zip.on('end',()=>{if(!stopped)resolve(extracted);});
    zip.on('entry',entry=>{(async()=>{
      const name=entry.fileName;
      if(name!=='manifest.json'&&!/^images\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(name))fail('Backup contains an unsafe or unexpected file path.');
      if(extracted.has(name)||extracted.size>=100001||(entry.generalPurposeBitFlag&1)||((entry.externalFileAttributes>>>16)&0xf000)===0xa000)fail('Backup contains duplicate, encrypted, linked, or too many files.');
      const limit=name==='manifest.json'?JSON_LIMIT:IMAGE_LIMIT;
      total+=entry.uncompressedSize;if(entry.uncompressedSize>limit||total>ARCHIVE_LIMIT)fail('Expanded backup exceeds the supported size limit.',413);
      const stream=await new Promise((resolve,reject)=>zip.openReadStream(entry,(e,s)=>e?reject(e):resolve(s)));
      const target=path.join(directory,randomUUID());const info=await receive(stream,target,limit);
      if(info.bytes!==entry.uncompressedSize)fail('Backup file size is inconsistent.');
      extracted.set(name,{...info,path:target});zip.readEntry();
    })().catch(stop);});zip.readEntry();
  });
}
async function restoreZip(store,file,revision){
  store.checkRevision(revision);const directory=await fsp.mkdtemp(path.join(store.staging,'restore-'));
  try{
    const files=await unpack(file,directory);const manifestFile=files.get('manifest.json');if(!manifestFile)fail('Backup manifest is missing.');
    let manifest;try{manifest=JSON.parse(await fsp.readFile(manifestFile.path,'utf8'));}catch{fail('Backup manifest is not valid JSON.');}
    if(manifest?.format!=='worldforge'||![3,4,5,6].includes(manifest.version)||!Array.isArray(manifest.images)||!Array.isArray(manifest.migrations)||!manifest.migrations.every(h=>/^[a-f0-9]{64}$/.test(h)))fail('Unsupported or malformed backup.');
    if(manifest.version<5)manifest=normalizeState(manifest);
    if(manifest.eras===undefined)manifest.eras=[];if(manifest.chronology===undefined)manifest.chronology=require('./era-model').defaultChronology();
    validateState(manifest);
    if(new Set(manifest.images.map(i=>i?.id)).size!==manifest.images.length||files.size!==manifest.images.length+1)fail('Backup has duplicate or unlisted image files.');
    const newImages=[],remap=new Map();
    for(const original of manifest.images){
      if(!original||!IMAGE_ID.test(original.id)||!new RegExp(`^${original.id}\\.(png|jpg|webp|gif)$`).test(original.filename)||!Object.values(formats).includes(original.mime)||typeof original.originalName!=='string'||original.originalName.length>255||!Number.isInteger(original.width)||!Number.isInteger(original.height))fail('Invalid image metadata.');
      const source=files.get(`images/${original.filename}`);
      if(!source||source.bytes!==original.bytes||source.sha256!==original.sha256)fail('Backup image is missing or has failed its checksum.');
      const info=await store.prepareImage(source.path,original.originalName,original.mime);
      if(info.width!==original.width||info.height!==original.height)fail('Backup image dimensions do not match its metadata.');
      newImages.push({...info,source:source.path});remap.set(original.id,info.id);
    }
    for(const r of imageRecords(manifest))if(r.image){const id=remap.get(r.image.match(IMAGE_URL)[1]);if(!id)fail('A record references an image missing from this backup.');r.image=`/api/images/${id}`;}
    const rollback=await checkpoint(store,'before-restore');
    for(const info of newImages)await store.installFile(info.source,info);
    const state=store.replace(manifest,revision,{newImages,migrationHashes:manifest.migrations});return {...state,rollback};
  }finally{await fsp.rm(directory,{recursive:true,force:true});}
}
async function legacyImport(store,raw,revision,migrate=false){
  const hash=createHash('sha256').update(raw).digest('hex');
  if(migrate&&store.db.prepare('SELECT hash FROM migrations WHERE hash=?').get(hash))return store.state();
  store.checkRevision(revision);
  let parsed;try{parsed=JSON.parse(raw);}catch{fail('This file is not valid JSON. Your existing records were not changed.');}
  if(!migrate&&!Array.isArray(parsed)&&(![1,2].includes(parsed?.version)||(parsed.format!==undefined&&parsed.format!=='worldforge')))fail('This is not a valid WORLDFORGE legacy backup.');
  const originalFile=path.join(store.backups,`legacy-original-${hash}.json`);
  if(!fs.existsSync(originalFile)){const temporary=originalFile+'.'+randomUUID()+'.partial';try{await fsp.writeFile(temporary,raw,{flag:'wx',mode:0o600});const handle=await fsp.open(temporary,'r+');await handle.sync();await handle.close();await fsp.rename(temporary,originalFile);}finally{await fsp.rm(temporary,{force:true});}}
  const rollback=await checkpoint(store,migrate?'before-migration':'before-import');
  const {state,newImages}=await store.convertLegacy(parsed);
  if(migrate){
    const old=store.state();
    for(const key of ['entries','maps']){
      const merged=[...old[key]];
      for(const record of state[key]){
        const existing=merged.find(e=>e.id===record.id);
        if(existing&&JSON.stringify(existing)===JSON.stringify(record))continue;
        merged.push(existing?{...record,id:randomUUID()}:record);
      }state[key]=merged;
    }
  }
  return {...store.replace(state,revision,{newImages,migrationHash:migrate?hash:null}),rollback};
}
module.exports={exportZip,checkpoint,verifyCheckpoint,restoreZip,legacyImport,ARCHIVE_LIMIT};

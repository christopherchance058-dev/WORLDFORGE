'use strict';
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const sharp = require('sharp');
const IMAGE_LIMIT = 50 * 1024 * 1024;
const JSON_LIMIT = 64 * 1024 * 1024;
const IMAGE_ID = /^[a-f0-9-]{36}$/;
const IMAGE_URL = /^\/api\/images\/([a-f0-9-]{36})$/;
const formats = {png:'image/png',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
function fail(message, status=400) { const e = new Error(message); e.status=status; throw e; }
function friendly(error) {
  if (['ENOSPC','SQLITE_FULL'].includes(error.code) || /database or disk is full/i.test(error.message)) return 'Disk is full. Free space on the data drive, then try again. Your previous records were preserved.';
  if (['EACCES','EPERM','EROFS','SQLITE_READONLY'].includes(error.code) || /readonly database/i.test(error.message)) return 'Cannot write to the data folder. Check its permissions and that the drive is writable.';
  return error.status ? error.message : 'The local server could not complete this operation. Check its terminal and data-drive permissions.';
}
function text(v,max,required=false){return typeof v==='string'&&v.length<=max&&(!required||v.trim().length>0);}
function validateState(state, legacy=false) {
  const {entries,maps}=state||{};
  const image=(value,required=false)=>typeof value==='string'&&(!value&&!required || IMAGE_URL.test(value) || legacy&&value.length<=IMAGE_LIMIT*1.4&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value));
  const ids=items=>new Set(items.map(x=>x?.id)).size===items.length;
  const common=x=>x&&text(x.id,120,true)&&text(x.title,120,true)&&text(x.description,30000)&&typeof x.updatedAt==='string'&&Number.isFinite(Date.parse(x.updatedAt));
  if(!Array.isArray(entries)||!Array.isArray(maps)||!ids(entries)||!ids(maps)||!entries.every(e=>common(e)&&e.description.trim()&&['Characters','Locations','History','Factions'].includes(e.category)&&Array.isArray(e.tags)&&e.tags.length<=30&&e.tags.every(t=>text(t,100))&&(e.year===''||Number.isInteger(e.year)&&Math.abs(e.year)<=999999)&&image(e.image))||!maps.every(m=>common(m)&&image(m.image,true)&&Array.isArray(m.pins)&&ids(m.pins)&&m.pins.every(p=>p&&text(p.id,120,true)&&text(p.title,120,true)&&text(p.description,10000)&&['gold','green','blue','red','purple'].includes(p.color)&&Number.isFinite(p.x)&&p.x>=0&&p.x<=1&&Number.isFinite(p.y)&&p.y>=0&&p.y<=1))) fail('This is not a valid WORLDFORGE document. Check entries, maps, images and pin coordinates.');
}
async function receive(stream,destination,limit) {
  let bytes=0,handle;const hash=createHash('sha256');
  try{
    handle=await fsp.open(destination,'wx',0o600);
    for await(const chunk of stream.iterator({destroyOnReturn:false})){
      bytes+=chunk.length;if(bytes>limit)fail(`File exceeds the ${Math.round(limit/1024/1024)} MB limit.`,413);
      hash.update(chunk);let offset=0;
      while(offset<chunk.length){const result=await handle.write(chunk,offset,chunk.length-offset);offset+=result.bytesWritten;}
    }
    await handle.sync();await handle.close();handle=null;
    return {bytes,sha256:hash.digest('hex')};
  }catch(e){if(handle)await handle.close();stream.resume();await fsp.rm(destination,{force:true});throw e;}
}
async function inspectImage(file) {
  try {
    const img=sharp(file,{limitInputPixels:80000000,failOn:'warning'});
    const meta=await img.metadata();
    if(!formats[meta.format]||!meta.width||!meta.height||meta.width*meta.height*(meta.pages||1)>80000000) fail('Use PNG, JPEG, WebP or GIF, with at most 80 million total pixels.');
    await img.stats(); // Decode pixels, not just the filename or declared MIME type.
    return {format:meta.format,mime:formats[meta.format],width:meta.width,height:meta.height};
  } catch(e){if(e.status)throw e;fail('The image cannot be opened. Choose a complete PNG, JPEG, WebP or GIF (up to 80 million pixels).');}
}
class Store {
  constructor(root) {
    this.root=path.resolve(root);this.images=path.join(this.root,'images');this.staging=path.join(this.root,'staging');this.backups=path.join(this.root,'backups');
    for(const dir of [this.root,this.images,this.staging,this.backups])fs.mkdirSync(dir,{recursive:true,mode:0o700});
    this.db=new DatabaseSync(path.join(this.root,'worldforge.sqlite'));
    if(![0,3].includes(this.db.prepare('PRAGMA user_version').get().user_version))fail('This database requires a different WORLDFORGE version. No migration was attempted.');
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, initialized INTEGER NOT NULL);
      INSERT OR IGNORE INTO settings VALUES(1,0,0);
      CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, filename TEXT UNIQUE NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, originalName TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, image_id TEXT REFERENCES images(id), payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS maps (id TEXT PRIMARY KEY, image_id TEXT NOT NULL REFERENCES images(id), payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS pins (map_id TEXT REFERENCES maps(id) ON DELETE CASCADE, id TEXT, x REAL NOT NULL CHECK(x>=0 AND x<=1), y REAL NOT NULL CHECK(y>=0 AND y<=1), payload TEXT NOT NULL, PRIMARY KEY(map_id,id));
      CREATE TABLE IF NOT EXISTS migrations (hash TEXT PRIMARY KEY);
      PRAGMA user_version=3;`);
  }
  state(){
    const meta=this.db.prepare('SELECT * FROM settings').get();
    const entries=this.db.prepare('SELECT * FROM entries ORDER BY rowid').all().map(r=>({...JSON.parse(r.payload),image:r.image_id?`/api/images/${r.image_id}`:''}));
    const pins=this.db.prepare('SELECT * FROM pins ORDER BY rowid').all();
    const grouped=new Map();for(const p of pins){if(!grouped.has(p.map_id))grouped.set(p.map_id,[]);grouped.get(p.map_id).push({...JSON.parse(p.payload),x:p.x,y:p.y});}
    const maps=this.db.prepare('SELECT * FROM maps ORDER BY rowid').all().map(r=>({...JSON.parse(r.payload),image:`/api/images/${r.image_id}`,pins:grouped.get(r.id)||[]}));
    return {version:3,revision:meta.revision,initialized:!!meta.initialized,entries,maps};
  }
  imageList(){return this.db.prepare('SELECT * FROM images ORDER BY id').all();}
  image(id){return this.db.prepare('SELECT * FROM images WHERE id=?').get(id);}
  checkRevision(revision){if(revision!==this.state().revision)fail('Your world changed in another tab. Copy any unsaved text, then reload before saving.',409);}
  replace(state,revision,{newImages=[],migrationHash=null,migrationHashes=[]}={}){
    validateState(state);this.checkRevision(revision);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const insert=this.db.prepare('INSERT OR IGNORE INTO images VALUES(?,?,?,?,?,?,?,?)');
      for(const i of newImages)insert.run(i.id,i.filename,i.mime,i.bytes,i.sha256,i.width,i.height,i.originalName);
      for(const r of [...state.entries,...state.maps])if(r.image&&!this.image(r.image.match(IMAGE_URL)[1]))fail('An image is missing. Upload it again or restore a complete backup.');
      this.db.exec('DELETE FROM pins; DELETE FROM maps; DELETE FROM entries;');
      for(const e of state.entries){const {image,...payload}=e;this.db.prepare('INSERT INTO entries VALUES(?,?,?)').run(e.id,image?image.match(IMAGE_URL)[1]:null,JSON.stringify(payload));}
      for(const m of state.maps){const {image,pins,...payload}=m;this.db.prepare('INSERT INTO maps VALUES(?,?,?)').run(m.id,image.match(IMAGE_URL)[1],JSON.stringify(payload));for(const p of pins){const {x,y,...rest}=p;this.db.prepare('INSERT INTO pins VALUES(?,?,?,?,?)').run(m.id,p.id,x,y,JSON.stringify(rest));}}
      this.db.prepare('UPDATE settings SET revision=revision+1, initialized=1 WHERE id=1').run();
      for(const hash of [...migrationHashes,...(migrationHash?[migrationHash]:[])])this.db.prepare('INSERT OR IGNORE INTO migrations VALUES(?)').run(hash);
      this.db.exec('COMMIT');return this.state();
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  async prepareImage(file,originalName='',expectedMime=null){
    const {size}=await fsp.stat(file);if(size>IMAGE_LIMIT)fail('Images may be at most 50 MB.',413);
    const info=await inspectImage(file);if(expectedMime&&expectedMime!==info.mime)fail('The image content does not match its file type.');
    const hash=createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);
    const sha256=hash.digest('hex');
    const existing=this.db.prepare('SELECT * FROM images WHERE sha256=? AND bytes=?').get(sha256,size);
    if(existing&&fs.existsSync(path.join(this.images,existing.filename)))return existing;
    const id=randomUUID();return {id,filename:`${id}.${info.format==='jpeg'?'jpg':info.format}`,mime:info.mime,bytes:size,sha256,width:info.width,height:info.height,originalName:typeof originalName==='string'?originalName.slice(0,255):''};
  }
  async installFile(file,info){const target=path.join(this.images,info.filename);try{await fsp.copyFile(file,target,fs.constants.COPYFILE_EXCL);const handle=await fsp.open(target,'r+');await handle.sync();await handle.close();}catch(e){if(e.code!=='EEXIST')throw e;}}
  async upload(file,name,mime){const info=await this.prepareImage(file,name,mime);await this.installFile(file,info);this.db.prepare('INSERT OR IGNORE INTO images VALUES(?,?,?,?,?,?,?,?)').run(info.id,info.filename,info.mime,info.bytes,info.sha256,info.width,info.height,info.originalName);return {image:`/api/images/${info.id}`,metadata:info};}
  async convertLegacy(input){
    let state;
    if(Array.isArray(input))state={entries:input,maps:this.state().maps};
    else if(input&&[1,2].includes(input.version))state={entries:input.entries,maps:input.version===1?this.state().maps:input.maps};
    else fail('Unsupported legacy backup version.');
    state=structuredClone(state);validateState(state,true);
    const newImages=[];const cache=new Map();
    for(const record of [...state.entries,...state.maps]){
      if(!record.image.startsWith('data:'))continue;
      const encoded=record.image;if(cache.has(encoded)){record.image=cache.get(encoded);continue;}
      const match=encoded.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
      const bytes=Buffer.from(match[2],'base64');if(bytes.toString('base64')!==match[2])fail('Invalid base64 image in legacy data.');
      const temp=path.join(this.staging,randomUUID());
      try{await fsp.writeFile(temp,bytes,{flag:'wx',mode:0o600});const info=await this.prepareImage(temp,'Migrated image',match[1]);await this.installFile(temp,info);newImages.push(info);record.image=`/api/images/${info.id}`;cache.set(encoded,record.image);}finally{await fsp.rm(temp,{force:true});}
    }
    return {state,newImages};
  }
  close(){this.db.close();}
}
module.exports={Store,fail,friendly,receive,inspectImage,validateState,IMAGE_ID,IMAGE_URL,IMAGE_LIMIT,JSON_LIMIT,formats};

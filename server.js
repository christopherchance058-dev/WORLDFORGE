'use strict';
const http=require('node:http');
const fs=require('node:fs');
const fsp=fs.promises;
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {pipeline}=require('node:stream/promises');
const {Store,fail,friendly,receive,IMAGE_ID,IMAGE_LIMIT,JSON_LIMIT,formats}=require('./storage');
const {Worlds}=require('./worlds');
const {exportZip,restoreZip,legacyImport,ARCHIVE_LIMIT}=require('./backups');
const files={'/entry-previews.js':'entry-previews.js','/diagram-model.js':'diagram-model.js','/ecosystem-model.js':'ecosystem-model.js','/diagram-editor.js':'diagram-editor.js','/canvases.js':'canvases.js','/connection-model.js':'connection-model.js','/connections.js':'connections.js','/folder-model.js':'folder-model.js','/folders.js':'folders.js','/magic-model.js':'magic-model.js','/magic.js':'magic.js','/creature-model.js':'creature-model.js','/creatures.js':'creatures.js','/era-model.js':'era-model.js','/eras.js':'eras.js','/timeline-layout.js':'timeline-layout.js','/history-timeline.js':'history-timeline.js','/history-model.js':'history-model.js','/history.js':'history.js','/category-colors.js':'category-colors.js','/editor-keys.js':'editor-keys.js','/entry-profile.js':'entry-profile.js','/faction-model.js':'faction-model.js','/factions.js':'factions.js','/navigation.js':'navigation.js','/description-links.js':'description-links.js','/entry-cards.js':'entry-cards.js','/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/maps.js':'maps.js','/api-client.js':'api-client.js','/theme.js':'theme.js','/symbols.js':'symbols.js','/geography-model.js':'geography-model.js','/geography.js':'geography.js','/character-model.js':'character-model.js','/characters.js':'characters.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const port=Number(process.env.PORT||3000);
let store;
try{store=new Store(process.env.WORLDFORGE_DATA_DIR||path.join(__dirname,'data'));}catch(e){console.error(`WORLDFORGE could not open its data folder: ${friendly(e)}`);process.exit(1);}
let worlds;
try{worlds=new Worlds(store);}catch(e){console.error(`WORLDFORGE could not open its worlds: ${friendly(e)}`);store.close();process.exit(1);}
let queue=Promise.resolve();
function exclusive(fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req,limit=JSON_LIMIT){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>limit)fail('Request is too large.',413);chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('Request is not valid JSON.');}}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
    const host=req.headers.host;
    if(!host||!/^((localhost|127\.0\.0\.1)(:\d+)?|\[::1\](:\d+)?)$/.test(host))fail('Only local computer access is supported.',403);
    if(req.headers.origin&&req.headers.origin!==`http://${host}`)fail('Cross-site requests are not allowed.',403);
    const url=new URL(req.url,`http://${host}`),route=url.pathname;
    if(!['GET','HEAD'].includes(req.method)&&req.headers['x-worldforge']!=='1')fail('Use the WORLDFORGE app to change local data.',403);
    if(req.method==='GET'&&route==='/api/worlds')return json(res,200,worlds.list());
    if(req.method==='POST'&&route==='/api/worlds'){const value=await body(req);return json(res,201,await exclusive(()=>worlds.create(value)));}
    if(req.method==='GET'&&route==='/api/worlds/trash')return json(res,200,worlds.trash());
    const trashRoute=route.match(/^\/api\/worlds\/(default|[a-f0-9-]{36})\/(restore|deletion-backup)$/);
    if(trashRoute&&req.method==='POST'&&trashRoute[2]==='restore')return json(res,200,await exclusive(()=>worlds.restore(trashRoute[1])));
    if(trashRoute&&req.method==='GET'&&trashRoute[2]==='deletion-backup'){const file=worlds.deletionBackup(trashRoute[1]);await fsp.access(file);res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="worldforge-deleted-world-backup.zip"','Cache-Control':'no-store'});await pipeline(fs.createReadStream(file),res);return;}
    const worldId=req.headers['x-worldforge-world']||url.searchParams.get('world')||'default';
    const store=route.startsWith('/api/')&&!route.startsWith('/api/images/')?worlds.store(worldId):worlds.root;
    if(req.method==='DELETE'&&route==='/api/world'){const value=await body(req);return json(res,200,await exclusive(()=>worlds.remove(worldId,value)));}
    if(req.method==='PUT'&&route==='/api/world'){const value=await body(req);return json(res,200,await exclusive(()=>worlds.update(worldId,value)));}
    if(req.method==='GET'&&route==='/api/state')return json(res,200,store.state());
    if(req.method==='PUT'&&route==='/api/state'){const value=await body(req);if(value.version!==6)fail('Please reload WORLDFORGE before saving. This server supports geography and location relationships.',409);return json(res,200,await exclusive(()=>store.replace(value,value.revision)));}
    if(req.method==='POST'&&route==='/api/migrate'){if(worldId!=='default')fail('Legacy browser data belongs to your original world.');const value=await body(req);if(typeof value.raw!=='string')fail('Missing legacy browser data.');return json(res,200,await exclusive(()=>legacyImport(store,value.raw,value.revision,true)));}
    if(req.method==='POST'&&route==='/api/images'){
      if(!Object.values(formats).includes(req.headers['content-type']))fail('Upload PNG, JPEG, WebP or GIF images.');
      if(Number(req.headers['content-length'])>IMAGE_LIMIT)fail('Images may be at most 50 MB.',413);
      const temp=path.join(store.staging,randomUUID());
      try{await receive(req,temp,IMAGE_LIMIT);let name='';try{name=decodeURIComponent(req.headers['x-filename']||'');}catch{fail('Invalid filename metadata.');}const result=await exclusive(()=>store.upload(temp,name,req.headers['content-type']));return json(res,201,result);}finally{await fsp.rm(temp,{force:true});}
    }
    if(req.method==='GET'&&route.startsWith('/api/images/')){
      const id=route.slice('/api/images/'.length);if(!IMAGE_ID.test(id))fail('Image not found.',404);const found=worlds.image(id);if(!found)fail('Image not found.',404);const {image}=found;
      const target=path.join(found.store.images,image.filename);await fsp.access(target);
      res.writeHead(200,{'Content-Type':image.mime,'Content-Length':image.bytes,'Cache-Control':'private, max-age=31536000, immutable'});await pipeline(fs.createReadStream(target),res);return;
    }
    if(req.method==='GET'&&route==='/api/backup'){
      // Serialize snapshot creation against edits/imports, with image bytes streamed to the browser.
      await exclusive(async()=>{const profile=worlds.profile(worldId),name=profile.title.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||worldId;res.setHeader('Content-Type','application/zip');res.setHeader('Content-Disposition',`attachment; filename="worldforge-${name}-${new Date().toISOString().slice(0,10)}.zip"`);await exportZip(store,res,profile);});return;
    }
    if(req.method==='POST'&&route==='/api/restore'){
      const revision=Number(req.headers['x-revision']);
      if(req.headers['content-type']==='application/json'){
        const value=await body(req);return json(res,200,await exclusive(()=>legacyImport(store,JSON.stringify(value),revision)));
      }
      if(req.headers['content-type']!=='application/zip')fail('Choose a WORLDFORGE ZIP or legacy JSON backup.');
      if(Number(req.headers['content-length'])>ARCHIVE_LIMIT)fail('Backup exceeds the configured import size limit.',413);
      const temp=path.join(store.staging,randomUUID());
      try{await receive(req,temp,ARCHIVE_LIMIT);return json(res,200,await exclusive(()=>restoreZip(store,temp,revision)));}finally{await fsp.rm(temp,{force:true});}
    }
    const file=files[route];if(req.method!=='GET'||!file)fail('Not found.',404);
    const data=await fsp.readFile(path.join(__dirname,file));res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache'});res.end(data);
  }catch(e){if(!e.status)console.error(e.code||e.name,e.message);if(!res.headersSent&&!res.destroyed)json(res,e.status||(['ENOSPC','SQLITE_FULL'].includes(e.code)?507:500),{error:friendly(e)});else if(!res.destroyed)res.destroy();}
});
server.requestTimeout=30*60*1000;
server.listen(port,'127.0.0.1',()=>console.log(`WORLDFORGE is running at http://localhost:${server.address().port}\nData folder: ${store.root}`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'That port is already in use. Stop the previous server or choose another PORT.':friendly(e));process.exitCode=1;worlds.close();});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{worlds.close();process.exit(0);}));

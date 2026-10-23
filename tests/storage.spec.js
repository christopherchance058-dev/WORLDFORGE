const {test,expect,manifest}=require('./fixtures');
const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('sharp');
const {randomBytes}=require('node:crypto');
const {ZipArchive}=require('archiver');
const {pipeline}=require('node:stream/promises');
const {createWriteStream}=require('node:fs');
const {Store,friendly}=require('../storage');
const {restoreZip}=require('../backups');
const headers={'X-Worldforge':'1'};
const entry=(image='')=>({id:'legacy-entry',title:'Old portrait',description:'Preserve this original',category:'Characters',image,year:'',tags:['original'],updatedAt:'2026-01-01T00:00:00.000Z'});
const map=(image)=>({id:'legacy-map',title:'Old world',description:'A preserved map',image,pins:[{id:'pin',title:'Home',description:'Original pin',color:'gold',x:.123,y:.789}],updatedAt:'2026-01-01T00:00:00.000Z'});
async function png(){return sharp({create:{width:24,height:16,channels:3,background:'#457866'}}).png().toBuffer();}
async function state(request){return (await request.get('/api/state')).json();}
async function upload(request,data,type='image/png',name='../../unsafe.png'){return request.post('/api/images',{headers:{...headers,'Content-Type':type,'X-Filename':encodeURIComponent(name)},data});}
async function zipFile(file,items){const z=new ZipArchive({zlib:{level:0}});const completion=pipeline(z,createWriteStream(file));for(const [name,data] of items)z.append(data,{name});z.finalize();await completion;}

test('legacy images migrate to files once, retain originals and rollback, and survive restart',async({page,request,library})=>{
 const bytes=await png();const data='data:image/png;base64,'+bytes.toString('base64');const legacy={version:2,entries:[entry(data)],maps:[map(data)]};const raw=JSON.stringify(legacy);
 await page.addInitScript(({raw})=>{if(localStorage.getItem('worldforge.entries.v1')===null)localStorage.setItem('worldforge.entries.v1',raw);},{raw});
 await page.goto('/');await expect(page.locator('.card')).toHaveCount(1);const stored=await state(request);expect(stored.entries[0].image).toMatch(/^\/api\/images\//);expect(stored.maps[0].pins).toEqual(legacy.maps[0].pins);expect(stored.maps[0].image).toBe(stored.entries[0].image);
 expect(await page.evaluate(()=>localStorage.getItem('worldforge.entries.v1'))).toBe(raw);const imageResponse=await request.get(stored.maps[0].image);expect(await imageResponse.body()).toEqual(bytes);
 const recovery=await fs.readdir(path.join(library.root,'backups'));expect(recovery.some(f=>f.startsWith('legacy-original-'))).toBe(true);expect(recovery.some(f=>f.includes('before-migration'))).toBe(true);
 const rawCopy=await fs.readFile(path.join(library.root,'backups',recovery.find(f=>f.startsWith('legacy-original-'))),'utf8');expect(rawCopy).toBe(raw);
 await library.restart();await page.reload();await expect(page.locator('.card')).toHaveCount(1);expect(await state(request)).toEqual(stored);expect((await fs.readdir(path.join(library.root,'backups'))).length).toBe(recovery.length);
 const restored=await request.post('/api/restore',{headers:{...headers,'Content-Type':'application/json','X-Revision':String(stored.revision)},data:JSON.stringify([entry(data)])});expect(restored.status()).toBe(200);expect((await restored.json()).maps).toEqual(stored.maps);
});

test('large image upload exceeds old quota, validates format and stores a safe relative filename',async({request,library})=>{
 const bytes=await sharp(randomBytes(1600*1600*3),{raw:{width:1600,height:1600,channels:3}}).png().toBuffer();expect(bytes.length).toBeGreaterThan(5*1024*1024);
 const response=await upload(request,bytes);expect(response.status()).toBe(201);const {image,metadata}=await response.json();expect(metadata.filename).toMatch(/^[a-f0-9-]{36}\.png$/);expect(await fs.readFile(path.join(library.root,'images',metadata.filename))).toEqual(bytes);expect(await (await request.get(image)).body()).toEqual(bytes);
 for(const type of ['jpeg','webp','gif']){const valid=await sharp(await png()).toFormat(type).toBuffer();expect((await upload(request,valid,`image/${type}`)).status()).toBe(201);}
 expect((await upload(request,Buffer.from('not an image'))).status()).toBe(400);expect((await upload(request,await png(),'image/jpeg')).status()).toBe(400);
 const tooBig=await upload(request,Buffer.alloc(50*1024*1024+1));expect(tooBig.status()).toBe(413);
 expect((await request.get('/api/images/not-a-file')).status()).toBe(404);expect((await request.get('/data/worldforge.sqlite')).status()).toBe(404);
});

test('portable backup restores into an empty folder and produces a working rollback',async({request,library})=>{
 const bytes=await png();const uploaded=await (await upload(request,bytes)).json();let current=await state(request);let response=await request.put('/api/state',{headers,data:{revision:current.revision,entries:[entry(uploaded.image)],maps:[map(uploaded.image)]}});expect(response.status()).toBe(200);current=await response.json();
 const zip=await (await request.get('/api/backup')).body();const backupFile=path.join(library.root,'portable.zip');await fs.writeFile(backupFile,zip);const exported=await manifest(backupFile);expect(exported.images).toHaveLength(1);
 const target=new Store(path.join(library.root,'other-computer'));try{
  const restored=await restoreZip(target,backupFile,0);expect(restored.entries[0].title).toBe('Old portrait');expect(restored.maps[0].pins).toEqual(current.maps[0].pins);const i=target.image(restored.maps[0].image.split('/').pop());expect(await fs.readFile(path.join(target.images,i.filename))).toEqual(bytes);
  const rollback=path.join(target.backups,restored.rollback);const rolled=await restoreZip(target,rollback,restored.revision);expect(rolled.entries).toHaveLength(0);expect(rolled.maps).toHaveLength(0);
 }finally{target.close();}
 response=await request.post('/api/restore',{headers:{...headers,'Content-Type':'application/zip','X-Revision':String(current.revision)},data:zip});expect(response.status()).toBe(200);const after=await response.json();expect(after.entries).toEqual(current.entries);expect(after.maps).toEqual(current.maps);
});

test('malformed archives, missing images and invalid coordinates cannot replace a library',async({request,library})=>{
 const image=(await (await upload(request,await png())).json()).image;const initial=await state(request);await request.put('/api/state',{headers,data:{revision:initial.revision,entries:[entry(image)],maps:[map(image)]}});const before=await state(request);
 const zip=await (await request.get('/api/backup')).body();const backupFile=path.join(library.root,'good.zip');await fs.writeFile(backupFile,zip);const metadata=await manifest(backupFile);const source=await fs.readFile(path.join(library.root,'images',metadata.images[0].filename));
 const cases=[
  [['manifest.json',JSON.stringify(metadata)]],
  [['manifest.json',JSON.stringify({...metadata,maps:[{...metadata.maps[0],pins:[{...metadata.maps[0].pins[0],x:2}]}]})],[`images/${metadata.images[0].filename}`,source]],
  [['manifest.json',JSON.stringify(metadata)],[`images/${metadata.images[0].filename}`,Buffer.from('damaged bytes')]],
  [['manifest.json',JSON.stringify(metadata)],['unexpected.txt','unsafe']],
  [['manifest.json',JSON.stringify({...metadata,version:99})],[`images/${metadata.images[0].filename}`,source]],
 ];
 for(let n=0;n<cases.length;n++){const bad=path.join(library.root,`bad-${n}.zip`);await zipFile(bad,cases[n]);const res=await request.post('/api/restore',{headers:{...headers,'Content-Type':'application/zip','X-Revision':String(before.revision)},data:await fs.readFile(bad)});expect(res.status()).toBe(400);expect(await state(request)).toEqual(before);}
 const badMigration=await request.post('/api/migrate',{headers,data:{revision:before.revision,raw:JSON.stringify({version:2,entries:[entry('data:image/png;base64,YmFk')],maps:[]})}});expect(badMigration.status()).toBe(400);expect(await state(request)).toEqual(before);
});

test('stale writes and cross-site requests rejected; real permission errors preserve records',async({request,library})=>{
 const old=await state(request);const next={entries:[entry()],maps:[],revision:old.revision};expect((await request.put('/api/state',{headers,data:next})).status()).toBe(200);const before=await state(request);
 expect((await request.put('/api/state',{headers,data:next})).status()).toBe(409);expect((await request.put('/api/state',{data:{...next,revision:before.revision}})).status()).toBe(403);expect((await request.post('/api/images',{headers:{...headers,Origin:'https://untrusted.example','Content-Type':'image/png'},data:await png()})).status()).toBe(403);
 await fs.chmod(path.join(library.root,'images'),0o500);try{const failed=await upload(request,await png());expect(failed.status()).toBe(500);expect((await failed.json()).error).toContain('permissions');expect(await state(request)).toEqual(before);}finally{await fs.chmod(path.join(library.root,'images'),0o700);}
 expect(friendly({code:'ENOSPC',message:'disk full'})).toContain('Disk is full');
});

test('one thousand distinct image files and metadata records fit outside browser storage',async({request,library})=>{
 test.setTimeout(120000);
 for(let i=0;i<1000;i++){
  const bytes=await sharp({create:{width:2,height:2,channels:3,background:{r:i%256,g:Math.floor(i/256),b:90}}}).png().toBuffer();
  const response=await upload(request,bytes,'image/png',`image-${i}.png`);expect(response.status()).toBe(201);
 }
 expect((await fs.readdir(path.join(library.root,'images'))).length).toBe(1000);
 await library.restart();const response=await request.get('/api/backup');expect(response.status()).toBe(200);const file=path.join(library.root,'library.zip');await fs.writeFile(file,await response.body());expect((await manifest(file)).images).toHaveLength(1000);
});

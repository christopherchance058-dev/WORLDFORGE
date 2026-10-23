const {test,expect,manifest}=require('./fixtures');
const sharp=require('sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {ZipArchive}=require('archiver');
const {pipeline}=require('node:stream/promises');
const {createWriteStream}=require('node:fs');
const headers={'X-Worldforge':'1'};
async function files(){return Promise.all([{name:'World.png',mimeType:'image/png',color:'#85ab87',width:900,height:600,format:'png'},{name:'City.webp',mimeType:'image/webp',color:'#b89d74',width:500,height:900,format:'webp'}].map(async f=>({name:f.name,mimeType:f.mimeType,buffer:await sharp({create:{width:f.width,height:f.height,channels:3,background:f.color}}).toFormat(f.format).toBuffer()})));}
async function create(page){await page.goto('/');await page.getByRole('button',{name:'Maps',exact:false}).click();await page.getByRole('button',{name:'New map',exact:true}).click();await page.getByLabel('Map title',{exact:true}).fill('Atlas');await page.getByLabel('Map images',{exact:true}).setInputFiles(await files());await expect(page.locator('.maps-dialog')).toContainText('2 images ready');await page.getByRole('button',{name:'Save map',exact:true}).click();await expect(page.locator('#map-background')).toBeVisible();await page.getByRole('button',{name:'Images',exact:true}).click();}
async function state(page){return page.evaluate(async()=>await (await fetch('/api/state')).json());}
async function add(page,title,x=.4,y=.5){await page.getByRole('button',{name:'Add pin',exact:true}).click();const r=await page.locator('#map-background').boundingBox();await page.mouse.click(r.x+r.width*x,r.y+r.height*y);await page.getByLabel('Pin title',{exact:true}).fill(title);await page.getByRole('button',{name:'Save pin',exact:true}).click();await expect(page.getByRole('button',{name:`Pin: ${title}`,exact:true})).toBeVisible();}
async function imageUpload(page,button,files){const choose=page.waitForEvent('filechooser');await page.getByRole('button',{name:button,exact:true}).click();await (await choose).setFiles(files);}

test('workspace occupies viewport, independent image pins, drag, panels and restart',async({page,library})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1440,height:950});await create(page);
 const box=await page.locator('#maps-section').boundingBox();expect(box).toEqual({x:0,y:0,width:1440,height:950});expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 await expect(page.locator('.canvas-card')).toHaveCount(2);await add(page,'World pin');await page.getByRole('button',{name:'Select image: City.webp',exact:true}).click();await expect(page.locator('.map-pin')).toHaveCount(0);await add(page,'City pin',.6,.35);
 await page.getByRole('button',{name:'Select image: World.png',exact:true}).click();await expect(page.getByRole('button',{name:'Pin: World pin',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Pin: City pin',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();const pin=await page.getByRole('button',{name:'Pin: World pin',exact:true}).boundingBox(),img=await page.locator('#map-background').boundingBox();
 await page.mouse.move(pin.x+pin.width/2,pin.y+pin.height/2);await page.mouse.down();await page.mouse.move(img.x+img.width*.55,img.y+img.height*.55,{steps:6});await page.mouse.up();await expect.poll(async()=>(await state(page)).maps[0].canvases[0].pins[0].x).toBeCloseTo(.55,2);
 const before=await page.locator('#map-viewport').boundingBox();await page.getByRole('button',{name:'Images',exact:true}).click();await expect(page.locator('#canvas-panel')).toBeHidden();await page.getByRole('button',{name:'Pin details',exact:true}).click();await expect(page.locator('#pin-panel')).toBeHidden();await expect.poll(async()=>(await page.locator('#map-viewport').boundingBox()).width).toBeGreaterThan(before.width);
 await page.setViewportSize({width:1050,height:700});await page.getByRole('button',{name:'Reset view',exact:true}).click();const after=await page.locator('#map-background').boundingBox(),marker=await page.locator('.map-pin').boundingBox();expect(Math.abs((marker.x+marker.width/2-after.x)/after.width-.55)).toBeLessThan(.005);
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('status')).toContainText('Map saved');await page.screenshot({path:'test-results/workspace-light.png',fullPage:true});
 await page.getByRole('button',{name:'Exit editor',exact:true}).click();await expect(page.locator('body')).not.toHaveClass(/map-editing/);await expect(page.locator('.sidebar')).toBeVisible();await library.restart();await page.reload();await page.getByRole('button',{name:'Maps',exact:false}).click();await page.locator('.map-card').click();expect((await state(page)).maps[0].canvases.map(c=>c.pins.length)).toEqual([1,1]);
 expect(errors).toEqual([]);
});

test('rename, reorder, add, replace and remove canvases with confirmations; ZIP round trip',async({page})=>{
 await create(page);await add(page,'Keep this pin');const original=await state(page);
 await page.getByRole('button',{name:'Rename image',exact:true}).click();await page.getByLabel('Image name',{exact:true}).fill('Main world');await page.getByRole('button',{name:'Save name',exact:true}).click();await expect(page.getByRole('button',{name:'Select image: Main world',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Move image down',exact:true}).click();await expect(page.locator('.canvas-card').first()).toContainText('City.webp');
 await imageUpload(page,'Replace image',[(await files())[1]]);await expect(page.locator('#confirm')).toContainText('Keep 1 pins');await page.locator('#confirm').getByRole('button',{name:'Cancel',exact:true}).click();expect((await state(page)).maps[0].canvases[1].image).toBe(original.maps[0].canvases[0].image);
 await imageUpload(page,'Replace image',[(await files())[1]]);await page.locator('#confirm').getByRole('button',{name:'Replace image',exact:true}).click();await expect.poll(async()=>(await state(page)).maps[0].canvases[1].image).toBe(original.maps[0].canvases[1].image);expect((await state(page)).maps[0].canvases[1].pins).toEqual(original.maps[0].canvases[0].pins);
 await imageUpload(page,'Add images',await files());await expect(page.locator('.canvas-card')).toHaveCount(4);
 await page.getByRole('button',{name:'Select image: Main world',exact:true}).click();await page.getByRole('button',{name:'Remove image',exact:true}).click();await expect(page.locator('#confirm')).toContainText('1 pins');await page.locator('#confirm').getByRole('button',{name:'Cancel'}).click();expect((await state(page)).maps[0].canvases).toHaveLength(4);
 await page.getByRole('button',{name:'Remove image',exact:true}).click();await page.locator('#confirm').getByRole('button',{name:'Remove image',exact:true}).click();await expect(page.locator('.canvas-card')).toHaveCount(3);
 await page.getByRole('button',{name:'Exit editor',exact:true}).click();const before=await state(page),downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup'}).click();const archive=await (await downloading).path();const metadata=await manifest(archive);expect(metadata.version).toBe(6);expect(metadata.maps).toEqual(before.maps);
 await page.locator('#backup-file').setInputFiles(archive);await page.locator('#confirm').getByRole('button',{name:'Import backup'}).click();await expect(page.getByRole('status')).toContainText('imported successfully');await page.reload();expect((await state(page)).maps).toEqual(before.maps);
});

test('light default ignores OS dark until System is chosen, themes persist and images are unfiltered',async({page,library})=>{
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await create(page);await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(await page.locator('#map-background').evaluate(e=>({filter:getComputedStyle(e).filter,opacity:getComputedStyle(e).opacity}))).toEqual({filter:'none',opacity:'1'});await page.screenshot({path:'test-results/workspace-dark.png',fullPage:true});
 await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('system');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');await library.restart();await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(page.getByRole('combobox',{name:'Theme',exact:true})).toHaveValue('light');
});

test('browser fullscreen toggle and exit keep the editor usable',async({page})=>{
 await create(page);await page.getByRole('button',{name:'Browser fullscreen',exact:true}).click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);await page.getByRole('button',{name:'Add pin',exact:true}).click();const r=await page.locator('#map-background').boundingBox();await page.mouse.click(r.x+r.width*.4,r.y+r.height*.4);await expect(page.locator('.maps-dialog')).toBeVisible();await page.locator('.maps-dialog').getByRole('button',{name:'Cancel'}).click();await page.getByRole('button',{name:'Exit editor',exact:true}).click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);await expect(page.locator('body')).not.toHaveClass(/map-editing/);
});

test('version 3 SQLite upgrade snapshots records and keeps image files and pins',async({request,library})=>{
 const f=(await files())[0],uploaded=await (await request.post('/api/images',{headers:{...headers,'Content-Type':f.mimeType,'X-Filename':f.name},data:f.buffer})).json();
 const legacy={id:'old-map',title:'Previous atlas',description:'Old schema',updatedAt:new Date().toISOString()};const oldPin={id:'old-pin',title:'Original',description:'Keep me',color:'blue'};
 await library.restart(async()=>{const db=new DatabaseSync(path.join(library.root,'worldforge.sqlite'));db.exec('PRAGMA foreign_keys=OFF; DROP TABLE canvas_pins; DROP TABLE map_canvases; DROP TABLE library_categories;');db.prepare('INSERT INTO maps VALUES(?,?,?)').run(legacy.id,uploaded.metadata.id,JSON.stringify(legacy));db.prepare('INSERT INTO pins VALUES(?,?,?,?,?)').run(legacy.id,oldPin.id,.2,.8,JSON.stringify(oldPin));db.exec('UPDATE settings SET initialized=1; PRAGMA user_version=3;');db.close();});
 const state=await (await request.get('/api/state')).json();expect(state.version).toBe(6);expect(state.maps[0].canvases).toHaveLength(1);expect(state.maps[0].canvases[0].pins[0]).toEqual({...oldPin,x:.2,y:.8});expect(await (await request.get(state.maps[0].canvases[0].image)).body()).toEqual(f.buffer);
 const snapshots=(await fs.readdir(path.join(library.root,'backups'))).filter(f=>f.startsWith('before-canvases-'));expect(snapshots).toHaveLength(1);const snapshot=new DatabaseSync(path.join(library.root,'backups',snapshots[0]),{readOnly:true});expect(snapshot.prepare('PRAGMA user_version').get().user_version).toBe(3);expect(snapshot.prepare('SELECT x,y FROM pins').get()).toEqual({x:.2,y:.8});snapshot.close();await library.restart();expect((await fs.readdir(path.join(library.root,'backups'))).filter(f=>f.startsWith('before-canvases-'))).toHaveLength(1);
 // The previous client is rejected before it can flatten a multi-image map.
 expect((await request.put('/api/state',{headers,data:{...state,version:3}})).status()).toBe(409);
});

test('version 3 ZIP imports as one canvas; version 4 rejects duplicate canvas IDs',async({request,library})=>{
 const f=(await files())[0],uploaded=await (await request.post('/api/images',{headers:{...headers,'Content-Type':f.mimeType},data:f.buffer})).json();const legacy={format:'worldforge',version:3,entries:[],maps:[{id:'v3',title:'Old ZIP',description:'',updatedAt:new Date().toISOString(),image:uploaded.image,pins:[{id:'p',title:'Old point',description:'',color:'gold',x:.1,y:.9}]}],images:[uploaded.metadata],migrations:[]};
 const zip=new ZipArchive(),file=path.join(library.root,'old.zip'),finished=pipeline(zip,createWriteStream(file));zip.append(JSON.stringify(legacy),{name:'manifest.json'});zip.append(f.buffer,{name:`images/${uploaded.metadata.filename}`});zip.finalize();await finished;
 const response=await request.post('/api/restore',{headers:{...headers,'Content-Type':'application/zip','X-Revision':'0'},data:await fs.readFile(file)});expect(response.status()).toBe(200);const state=await response.json();expect(state.maps[0].canvases[0].pins).toEqual(legacy.maps[0].pins);const bad=structuredClone(state);bad.maps[0].canvases.push({...bad.maps[0].canvases[0]});expect((await request.put('/api/state',{headers,data:bad})).status()).toBe(400);expect((await (await request.get('/api/state')).json()).maps).toEqual(state.maps);
});

test('mixed image batch reports invalid files and locks navigation until saving completes',async({page})=>{
 await create(page);
 let release;const hold=new Promise(resolve=>release=resolve);
 await page.route('**/api/images',async route=>{await hold;await route.continue();});
 await imageUpload(page,'Add images',[(await files())[0],{name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')}]);
 await expect(page.getByRole('button',{name:'Exit editor',exact:true})).toBeDisabled();
 release();await expect(page.locator('.canvas-card')).toHaveCount(3);await expect(page.locator('#map-message')).toContainText('broken.png');await expect(page.getByRole('button',{name:'Exit editor',exact:true})).toBeEnabled();
 expect((await state(page)).maps[0].canvases).toHaveLength(3);
});

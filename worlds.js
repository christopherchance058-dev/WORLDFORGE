'use strict';
// A small catalogue in the original database; each added world reuses Store unchanged.
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {Store,fail}=require('./storage');
const {checkpoint,verifyCheckpoint}=require('./backups');
class Worlds {
 constructor(root){
  this.root=root;this.opened=new Map([['default',root]]);
  const exists=root.db.prepare("SELECT name FROM sqlite_master WHERE name='world_catalog'").get();
  if(!exists&&root.state().initialized){
   const snapshot=path.join(root.backups,`before-worlds-${randomUUID()}.sqlite`);
   root.db.prepare('VACUUM INTO ?').run(snapshot);
   const check=new DatabaseSync(snapshot,{readOnly:true});
   try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')fail('The safety copy could not be verified. Worlds were not enabled.');}finally{check.close();}
  }
  root.db.exec(`CREATE TABLE IF NOT EXISTS world_catalog (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0); INSERT OR IGNORE INTO world_catalog(id,title,description) VALUES('default','Your world','A home for your stories.'); CREATE TABLE IF NOT EXISTS world_trash (id TEXT PRIMARY KEY REFERENCES world_catalog(id), deleted_at TEXT NOT NULL, backup TEXT NOT NULL);`);
  if(!this.list().length)this.create({title:'New world',description:''});
 }
 list(){return this.root.db.prepare('SELECT w.* FROM world_catalog w WHERE NOT EXISTS(SELECT 1 FROM world_trash t WHERE t.id=w.id) ORDER BY w.rowid').all();}
 profile(id,includeTrash=false){const p=this.root.db.prepare('SELECT * FROM world_catalog WHERE id=?').get(id);if(!includeTrash&&this.root.db.prepare('SELECT id FROM world_trash WHERE id=?').get(id))fail('This world is in Trash. Switch worlds or restore it from the world switcher.',410);if(!p)fail('World not found. Choose another world.',404);return p;}
 store(id='default',includeTrash=false){
  this.profile(id,includeTrash);
  if(!this.opened.has(id)){const directory=path.join(this.root.root,'worlds',id);if(!fs.existsSync(path.join(directory,'worldforge.sqlite')))fail('This world’s database is missing. Download its backup and restore it into an empty world.',409);this.opened.set(id,new Store(directory));}
  return this.opened.get(id);
 }
 validate(value){if(typeof value?.title!=='string'||!value.title.trim()||value.title.length>120||typeof value.description!=='string'||value.description.length>3000)fail('Give your world a name (up to 120 characters) and a description of up to 3,000 characters.');}
 create(value){
  this.validate(value);this.uniqueTitle(value.title);const id=randomUUID(),directory=path.join(this.root.root,'worlds',id);let store;
  try{store=new Store(directory);const initial=store.state();store.replace({...initial,entries:[],maps:[]},initial.revision);this.root.db.prepare('INSERT INTO world_catalog(id,title,description) VALUES(?,?,?)').run(id,value.title.trim(),value.description.trim());this.opened.set(id,store);return this.profile(id);}
  catch(e){store?.close();/* Only this newly generated, unregistered directory is disposable. */if(!this.root.db.prepare('SELECT id FROM world_catalog WHERE id=?').get(id))fs.rmSync(directory,{recursive:true,force:true});throw e;}
 }
 uniqueTitle(title,except){if(this.list().some(w=>w.id!==except&&w.title.toLowerCase()===title.trim().toLowerCase()))fail('A world already has that name. Choose a different name.');}
 update(id,value){this.validate(value);this.uniqueTitle(value.title,id);const p=this.profile(id);if(value.revision!==p.revision)fail('This world’s details changed in another tab. Reopen the world settings and try again.',409);this.root.db.prepare('UPDATE world_catalog SET title=?, description=?, revision=revision+1 WHERE id=?').run(value.title.trim(),value.description.trim(),id);return this.profile(id);}
 trash(){return this.root.db.prepare('SELECT w.*,t.deleted_at AS deletedAt,t.backup FROM world_catalog w JOIN world_trash t ON t.id=w.id ORDER BY t.deleted_at DESC').all();}
 async remove(id,value){
  const profile=this.profile(id),store=this.store(id);store.checkRevision(value?.revision);if(profile.revision!==value?.profileRevision)fail('The world details changed. Reopen the world before deleting it.',409);
  const backup=await checkpoint(store,'before-world-deletion',profile);await verifyCheckpoint(store,backup,profile);
  if(this.list().length===1)this.create({title:profile.title.toLowerCase()==='new world'?'Your world':'New world',description:''});
  this.root.db.prepare('INSERT INTO world_trash VALUES(?,?,?)').run(id,new Date().toISOString(),backup);
  return {nextWorldId:this.list()[0].id,backup};
 }
 restore(id){
  const record=this.trash().find(w=>w.id===id);if(!record)fail('This world is not in Trash.',404);this.store(id,true);
  let title=record.title;for(let n=1;this.list().some(w=>w.title.toLowerCase()===title.toLowerCase());n++)title=record.title.slice(0,95)+` (restored${n===1?'':' '+n})`;
  this.root.db.exec('BEGIN IMMEDIATE');try{if(title!==record.title)this.root.db.prepare('UPDATE world_catalog SET title=?,revision=revision+1 WHERE id=?').run(title,id);this.root.db.prepare('DELETE FROM world_trash WHERE id=?').run(id);this.root.db.exec('COMMIT');}catch(e){this.root.db.exec('ROLLBACK');throw e;}return this.profile(id);
 }
 deletionBackup(id){const record=this.trash().find(w=>w.id===id);if(!record)fail('Deletion backup not found.',404);const root=id==='default'?this.root.root:path.join(this.root.root,'worlds',id);return path.join(root,'backups',record.backup);}
 image(id){for(const p of this.list()){const store=this.store(p.id),image=store.image(id);if(image)return {store,image};}return null;}
 close(){for(const store of this.opened.values())store.close();}
}
module.exports={Worlds};

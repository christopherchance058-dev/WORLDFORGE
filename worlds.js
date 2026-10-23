'use strict';
// A small catalogue in the original database; each added world reuses Store unchanged.
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {Store,fail}=require('./storage');
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
  root.db.exec(`CREATE TABLE IF NOT EXISTS world_catalog (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0); INSERT OR IGNORE INTO world_catalog(id,title,description) VALUES('default','Your world','A home for your stories.');`);
 }
 list(){return this.root.db.prepare('SELECT * FROM world_catalog ORDER BY rowid').all();}
 profile(id){const p=this.root.db.prepare('SELECT * FROM world_catalog WHERE id=?').get(id);if(!p)fail('World not found. Choose another world.',404);return p;}
 store(id='default'){
  this.profile(id);
  if(!this.opened.has(id))this.opened.set(id,new Store(path.join(this.root.root,'worlds',id)));
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
 image(id){for(const p of this.list()){const store=this.store(p.id),image=store.image(id);if(image)return {store,image};}return null;}
 close(){for(const store of this.opened.values())store.close();}
}
module.exports={Worlds};

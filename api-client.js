'use strict';
const LocalAPI={
 revision:0,
 worldId:'default',
 appearance:{image:''},
 async request(url,options={}){
  let response;try{response=await fetch(url,{...options,headers:{'X-Worldforge':'1','X-Worldforge-World':this.worldId,...options.headers}});}catch{throw new Error('Cannot reach the local server. Start it with npm start, then try again.');}
  let result;try{result=await response.json();}catch{throw new Error('The server returned an incomplete response. Check disk space and the server terminal.');}
  if(!response.ok)throw new Error(result.error||'The local server could not save this change.');return result;
 },
 accept(state){this.revision=state.revision;this.appearance=state.appearance||{image:''};return state;},
 async state(){return this.accept(await this.request('/api/state'));},
 async save(entries,maps,categories,appearance=this.appearance){return this.accept(await this.request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:6,revision:this.revision,entries,maps,categories,appearance})}));},
 async upload(file){if(file.size>50*1024*1024)throw new Error('Images may be at most 50 MB.');return (await this.request('/api/images',{method:'POST',headers:{'Content-Type':file.type,'X-Filename':encodeURIComponent(file.name)},body:file})).image;},
 async migrate(raw){return this.accept(await this.request('/api/migrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:this.revision,raw})}));},
 async restore(file){return this.accept(await this.request('/api/restore',{method:'POST',headers:{'Content-Type':file.name.toLowerCase().endsWith('.json')?'application/json':'application/zip','X-Revision':String(this.revision)},body:file}));}
};

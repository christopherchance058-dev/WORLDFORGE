/* Shared browser/server organization, separate from lore records. */
(function(root){
 const empty=()=>({folders:[],assignments:[]}),kind=e=>e.referenceKind==='era'?'era':'entry';
 const key=(id,type='entry')=>JSON.stringify([type,id]);
 function targets(state){return new Map([...state.entries.map(e=>[key(e.id),e]),...(state.eras||[]).map(e=>[key(e.id,'era'),{...e,category:'History'}])]);}
 function validate(value,state){
  const text=(v,n)=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=n;
  if(!value||!Array.isArray(value.folders)||!Array.isArray(value.assignments)||value.folders.length>10000||value.assignments.length>100000)throw Error('Invalid folder organization.');
  const ids=new Set(),names=new Set(),folders=new Map(),records=targets(state),assigned=new Set();
  for(const f of value.folders){if(!f||!text(f.id,120)||['all','unfiled'].includes(f.id)||ids.has(f.id)||!text(f.name,120)||!state.categories.some(c=>c.name===f.category))throw Error('Folders need a unique ID, category and name (up to 120 characters).');if(['unfiled','all '+f.category.toLowerCase()].includes(f.name.toLowerCase()))throw Error('Choose a folder name other than the built-in All or Unfiled views.');const name=JSON.stringify([f.category,f.name.toLowerCase()]);if(names.has(name))throw Error('A folder with this name already exists in this category.');ids.add(f.id);names.add(name);folders.set(f.id,f);}
  for(const a of value.assignments){if(!a||!['entry','era'].includes(a.kind)||!text(a.id,120)||!text(a.folderId,120))throw Error('Invalid folder assignment.');const k=key(a.id,a.kind),target=records.get(k),folder=folders.get(a.folderId);if(assigned.has(k)||!folder||!target||folder.category!==target.category)throw Error('Each entry can belong to one folder in its own category.');assigned.add(k);}
 }
 // Read/import recovery keeps records discoverable when a reference is unavailable.
 function recover(value,state){if(!value)return empty();if(!Array.isArray(value.folders)||!Array.isArray(value.assignments))return value;const records=targets(state);return {...value,assignments:value.assignments.filter(a=>{const f=value.folders.find(f=>f?.id===a?.folderId),e=records.get(key(a?.id,a?.kind));return !!f&&!!e&&f.category===e.category;})};}
 function assignment(value,e){return value.assignments.find(a=>a.id===e.id&&a.kind===kind(e))?.folderId||'';}
 const api={empty,key,kind,validate,recover,assignment};if(typeof module!=='undefined')module.exports=api;else root.FolderModel=api;
})(globalThis);

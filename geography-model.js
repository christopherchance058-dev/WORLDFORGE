/* Additive location metadata shared by the browser, API and backup validation. */
(function(root){
 const types={realm:'World / Realm',region:'Continent / Region',sea:'Ocean / Sea',island:'Island / Archipelago',settlement:'City / Settlement',district:'City District / Neighborhood',village:'Village / Outpost',landmark:'Landmark / Natural Feature',building:'Building / Establishment',dungeon:'Dungeon / Ruin',underwater:'Underwater Location',route:'Route / Sea Passage'};
 const statuses=['inhabited','abandoned','hidden','destroyed','uninhabited','unknown'];
 const texts={population:120,government:4000,climate:4000,dangers:6000,resources:4000,secrets:10000};
 const lists=['inhabitantIds','pointOfInterestIds','connectedLocationIds','relatedEntryIds','rulerIds','controllingFactionIds'];
 const singles=['parentId','rulerId','controllingFactionId'];
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const isLocation=e=>!!e&&(e.category==='Locations'||object(e.location));
 const string=v=>typeof v==='string'?v:'';
 const read=e=>{
  const g=object(e?.location)?e.location:{};
  return {...g,type:string(g.type),status:string(g.status),...Object.fromEntries(Object.keys(texts).map(k=>[k,string(g[k])])),...Object.fromEntries(singles.map(k=>[k,string(g[k])||null])),...Object.fromEntries(lists.map(k=>[k,Array.isArray(g[k])?g[k].filter(id=>typeof id==='string'):k==='rulerIds'&&g.rulerId?[g.rulerId]:k==='controllingFactionIds'&&g.controllingFactionId?[g.controllingFactionId]:[]])),travel:Array.isArray(g.travel)?g.travel.filter(object).map(t=>({...t,destinationId:string(t.destinationId)||null,destinationLabel:string(t.destinationLabel),method:string(t.method),duration:string(t.duration),notes:string(t.notes)})):[]};
 };
 function ancestry(entry,entries){const byId=new Map(entries.map(e=>[e.id,e])),seen=new Set([entry.id]),result=[];let parent=read(entry).parentId;while(parent&&!seen.has(parent)&&result.length<64){seen.add(parent);const e=byId.get(parent);if(!isLocation(e))break;result.unshift(e);parent=read(e).parentId;}return result;}
 function descendants(id,entries){const found=new Set(),queue=[id],children=new Map();entries.filter(isLocation).forEach(e=>{const p=read(e).parentId;if(!children.has(p))children.set(p,[]);children.get(p).push(e.id);});while(queue.length){for(const child of children.get(queue.pop())||[])if(child!==id&&!found.has(child)){found.add(child);queue.push(child);}}return found;}
 function references(g,id){return singles.some(k=>g[k]===id)||lists.some(k=>g[k].includes(id))||g.travel.some(t=>t.destinationId===id);}
 function deletion(entries,entry){
  const parent=read(entry).parentId,parentEntry=entries.find(e=>e.id===parent&&isLocation(e));let children=0,referencing=0;
  const next=entries.filter(e=>e.id!==entry.id).map(e=>{
   if(!object(e.location))return e;const g=read(e);if(!references(g,entry.id))return e;referencing++;
   if(g.parentId===entry.id){g.parentId=parentEntry?.id||null;children++;}
   for(const key of ['rulerId','controllingFactionId'])if(g[key]===entry.id)g[key]=null;
   for(const key of lists)g[key]=g[key].filter(id=>id!==entry.id);
   g.rulerId=g.rulerIds[0]||null;g.controllingFactionId=g.controllingFactionIds[0]||null;
   g.travel=g.travel.map(t=>t.destinationId===entry.id?{...t,destinationId:null,destinationLabel:entry.title}:t);
   return {...e,location:g,updatedAt:new Date().toISOString()};
  });
  return {entries:next,children,referencing,parent:parentEntry};
 }
 function validateSelectionNotes(notes,keys){if(notes===undefined)return;if(!object(notes)||Object.keys(notes).some(k=>!keys.includes(k)))throw new Error('Invalid selection notes.');for(const values of Object.values(notes))if(!Array.isArray(values)||values.length>500||values.some(n=>typeof n!=='string'||!n.trim()||n.length>120)||new Set(values).size!==values.length)throw new Error('Use up to 500 unique notes of 120 characters per selection.');}
 function validate(entries){
  const byId=new Map(entries.map(e=>[e.id,e]));
  const fail=message=>{throw new Error(message);};
  const validText=(v,n)=>typeof v==='string'&&v.length<=n;
  for(const e of entries){
   if(e.location===undefined)continue;const g=e.location;
   if(!object(g))fail('Location details must be an object.');
   if(g.type!==undefined&&!validText(g.type,120))fail('Location type must be text, up to 120 characters.');
   if(g.status!==undefined&&!validText(g.status,120))fail('Location status must be text, up to 120 characters.');
   validateSelectionNotes(g.selectionNotes,lists);
   for(const [key,max] of Object.entries(texts))if(g[key]!==undefined&&!validText(g[key],max))fail(`Invalid location field: ${key} (maximum ${max} characters).`);
   const reference=(id,locationsOnly=false)=>{
    if(id===null||id==='')return;
    if(!validText(id,120)||id===e.id||!byId.has(id)||(locationsOnly&&!isLocation(byId.get(id))))fail('A location link is missing, points to itself, or is not a location where one is required. Reassign or remove the link.');
   };
   for(const key of singles)if(g[key]!==undefined)reference(g[key],key==='parentId');
   for(const key of lists)if(g[key]!==undefined){if(!Array.isArray(g[key])||g[key].length>500||new Set(g[key]).size!==g[key].length)fail('Location links must be a list of unique entry IDs (up to 500).');for(const id of g[key]){if(!id)fail('Empty location reference.');reference(id,['pointOfInterestIds','connectedLocationIds'].includes(key));}}
   if(g.travel!==undefined){if(!Array.isArray(g.travel)||g.travel.length>100)fail('Use up to 100 travel connections per location.');for(const t of g.travel){if(!object(t))fail('Invalid travel connection.');if(t.destinationId!==undefined)reference(t.destinationId,true);for(const [key,max] of Object.entries({destinationLabel:120,method:120,duration:120,notes:2000}))if(t[key]!==undefined&&!validText(t[key],max))fail('Invalid travel method, time, or notes.');}}
  }
  // Follow parent chains independently of the interface; imports cannot bypass this check.
  const depths=new Map();
  for(const e of entries.filter(isLocation)){
   let cursor=e;const chain=[],seen=new Set();
   while(cursor&&!depths.has(cursor.id)){if(seen.has(cursor.id))fail('Circular parent locations are not allowed.');if(chain.length>=64)fail('Location hierarchies may be up to 64 levels deep.');seen.add(cursor.id);chain.push(cursor.id);const parent=read(cursor).parentId;cursor=parent?byId.get(parent):null;}
   let depth=cursor?depths.get(cursor.id):0;
   for(const id of chain.reverse()){depth++;if(depth>64)fail('Location hierarchies may be up to 64 levels deep.');depths.set(id,depth);}
  }
 }
 const api={validateSelectionNotes,types,statuses,texts,lists,singles,isLocation,read,ancestry,descendants,references,deletion,validate};
 if(typeof module!=='undefined')module.exports=api;else root.GeographyModel=api;
})(globalThis);

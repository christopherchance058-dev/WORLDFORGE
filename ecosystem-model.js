/* Ecosystem membership and food-web meaning are independent of generic diagram layout. */
(function(root){
 const Graph=typeof module!=='undefined'?require('./diagram-model'):root.DiagramModel,Links=typeof module!=='undefined'?require('./description-links'):root.DescriptionLinks;
 function validate(records,image=v=>typeof v==='string'&&(!v||/^\/api\/images\/[a-f0-9-]{36}$/.test(v)),entries=[]){
  if(!Array.isArray(records)||records.length>1000)throw new Error('Use up to 1000 ecosystems.');const ids=new Set();
  for(const e of records){if(!e||typeof e.id!=='string'||!e.id.trim()||e.id.length>120||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||e.name.length>120||typeof e.description!=='string'||e.description.length>30000||!image(e.image)||typeof e.updatedAt!=='string'||!Number.isFinite(Date.parse(e.updatedAt)))throw new Error('Each ecosystem needs a unique ID, name and valid description and artwork.');ids.add(e.id);
   for(const key of ['inhabitantIds','locationIds'])if(!Array.isArray(e[key])||e[key].length>500||new Set(e[key]).size!==e[key].length||e[key].some(id=>typeof id!=='string'||!id.trim()||id.length>120))throw new Error('Ecosystem selections need unique entry IDs.');
   for(const id of e.locationIds){const entry=entries.find(x=>x.id===id);if(entry&&!((typeof module!=='undefined'?require('./geography-model'):root.GeographyModel).isLocation(entry)))throw new Error('Linked places must be Location entries.');}
   Links.validate(e);Graph.validate(e.diagram);if(e.diagram.nodes.some(n=>n.kind==='entry'&&!e.inhabitantIds.includes(n.entryId)))throw new Error('Diagram entries must belong to this ecosystem.');
  }
 }
 function snapshot(records,entries){const byId=new Map(entries.map(e=>[e.id,e]));return records.map(e=>({...e,inhabitantNames:{...e.inhabitantNames,...Object.fromEntries(e.inhabitantIds.filter(id=>byId.has(id)).map(id=>[id,byId.get(id).title]))},locationNames:{...e.locationNames,...Object.fromEntries(e.locationIds.filter(id=>byId.has(id)).map(id=>[id,byId.get(id).title]))},diagram:{...e.diagram,nodes:e.diagram.nodes.map(n=>n.kind==='entry'&&byId.has(n.entryId)?{...n,label:byId.get(n.entryId).title}:n)}}));}
 const api={validate,snapshot};if(typeof module!=='undefined')module.exports=api;else root.EcosystemModel=api;
})(globalThis);

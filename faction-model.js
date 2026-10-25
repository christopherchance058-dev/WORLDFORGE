/* Additive faction lore, shared by the browser, server and backup validation. */
(function(root){
 const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 // [key, label, maximum stored length, multiline, supports shared @ linking]
 const groups=[
  ['Identity & classification',[
   ['type','Faction type',120,false,false],['status','Faction status',120,false,false],['aliases','Other names & aliases',1000,false,true],['motto','Motto',1000,false,true]]],
  ['Leadership & structure', [['structure','Leadership & organization',4000,true,true]]],
  ['Founding & history', [['founded','Founded',120,false,false],['history','Founding & history',6000,true,true]]],
  ['Purpose & beliefs', [['goals','Goals & purpose',4000,true,true],['beliefs','Beliefs & values',4000,true,true],['reputation','Public reputation',3000,true,true]]],
  ['Headquarters & territory', [['influence','Territory & sphere of influence',4000,true,true]]],
  ['Membership & recruitment', [['size','Membership size',120,false,false],['recruitment','Membership & recruitment',4000,true,true]]],
  ['Allies, rivals & linked lore', [['diplomacy','Relationships & agreements',4000,true,true]]],
  ['Resources & capabilities', [['resources','Resources & funding',4000,true,true],['capabilities','Capabilities & methods',4000,true,true]]],
  ['Culture & internal life', [['culture','Culture & traditions',4000,true,true],['divisions','Internal divisions & conflicts',4000,true,true],['secrets','Secrets & hidden agendas',6000,true,true]]]
 ];
 const fields=groups.flatMap(([,fields])=>fields),linkFields=fields.filter(f=>f[4]).map(f=>f[0]);
 const lists={headquartersIds:'Headquarters',leaderIds:'Leaders',founderIds:'Founders',territoryIds:'Linked territories',memberIds:'Important members',allyIds:'Allies',rivalIds:'Rivals',relatedIds:'Related lore'};
 const isFaction=e=>!!e&&(e.category==='Factions'||object(e.faction));
 function read(e){const f=object(e?.faction)?e.faction:{};return {...f,...Object.fromEntries(fields.map(([k])=>[k,typeof f[k]==='string'?f[k]:''])),headquartersId:typeof f.headquartersId==='string'?f.headquartersId:null,...Object.fromEntries(Object.keys(lists).map(k=>[k,Array.isArray(f[k])?f[k].filter(id=>typeof id==='string'):k==='headquartersIds'&&f.headquartersId?[f.headquartersId]:[]]))};}
 function references(f,id){return f.headquartersId===id||Object.keys(lists).some(k=>f[k].includes(id));}
 function deletion(entries,entry){let count=0;return {get count(){return count;},entries:entries.map(e=>{if(!object(e.faction))return e;const f=read(e);if(!references(f,entry.id))return e;count++;if(f.headquartersId===entry.id)f.headquartersId=null;for(const k of Object.keys(lists))f[k]=f[k].filter(id=>id!==entry.id);f.headquartersId=f.headquartersIds[0]||null;return {...e,faction:f,updatedAt:new Date().toISOString()};})};}
 function validate(entries){const byId=new Map(entries.map(e=>[e.id,e]));const fail=message=>{throw new Error(message);};for(const e of entries){if(e.faction===undefined)continue;const f=e.faction;if(!object(f))fail('Faction details must be an object.');for(const [k,label,max] of fields)if(f[k]!==undefined&&(typeof f[k]!=='string'||f[k].length>max))fail(`${label} must be text of up to ${max} characters.`);
  function reference(id,location=false){if(typeof id!=='string'||!id||id===e.id||!byId.has(id)||(location&&!(byId.get(id).category==='Locations'||object(byId.get(id).location))))fail('A faction link is missing or invalid. Choose an existing entry or remove the link.');}
  if(f.headquartersId!==undefined&&f.headquartersId!==null&&f.headquartersId!=='')reference(f.headquartersId,true);
  for(const k of Object.keys(lists))if(f[k]!==undefined){if(!Array.isArray(f[k])||f[k].length>500||new Set(f[k]).size!==f[k].length)fail('Faction links must contain up to 500 unique entry IDs.');for(const id of f[k])reference(id,k==='territoryIds'||k==='headquartersIds');}
  (typeof module!=='undefined'?require('./geography-model').validateSelectionNotes:root.GeographyModel.validateSelectionNotes)(f.selectionNotes,Object.keys(lists));
 }}
 const api={groups,fields,linkFields,lists,isFaction,read,references,deletion,validate};if(typeof module!=='undefined')module.exports=api;else root.FactionModel=api;
})(globalThis);

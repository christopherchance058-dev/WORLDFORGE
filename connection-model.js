/* Optional typed connections; legacy relationship owners remain unchanged. */
(function(root){
 const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v),key=(id,kind='entry')=>JSON.stringify([kind,id]);
 function collections(e){return [e.connections,e.character?.relationships,e.creature?.relationships,e.magic?.relationships].filter(Array.isArray);}
 function normalize(r){return {...r,entryIds:Array.isArray(r.entryIds)?[...r.entryIds]:r.entryId?[r.entryId]:[],eraIds:Array.isArray(r.eraIds)?[...r.eraIds]:[],ecosystemIds:Array.isArray(r.ecosystemIds)?[...r.ecosystemIds]:[],type:r.type||'',description:r.description||'',history:r.history||'',formerTargets:r.formerTargets||[],formerEraTargets:r.formerEraTargets||[],formerEcosystemTargets:r.formerEcosystemTargets||[]};}
 function rows(e){return collections(e).flatMap(a=>a.map(normalize));}
 function validate(e,kind='entry'){
  const text=(v,n)=>typeof v==='string'&&v.length<=n,id=v=>text(v,120)&&!!v.trim(),fail=m=>{throw Error(m);};
  if(e.connections!==undefined&&!Array.isArray(e.connections))fail('Connections must be a list.');
  for(const collection of collections(e)){if(collection.length>200)fail('Use up to 200 connections per list.');const ids=new Set();for(const r of collection){if(!object(r))fail('Invalid connection.');if(collection===e.connections&&!id(r.id))fail('Connections need stable IDs.');if(r.entryId!==undefined&&r.entryId!==null&&r.entryId!==''&&(!id(r.entryId)||(kind==='entry'&&r.entryId===e.id)))fail('Invalid legacy connection target.');if(r.id!==undefined&&(!id(r.id)||ids.has(r.id)))fail('Connection IDs must be unique.');if(r.id!==undefined)ids.add(r.id);for(const [field,type] of [['entryIds','entry'],['eraIds','era'],['ecosystemIds','ecosystem']])if(r[field]!==undefined&&(!Array.isArray(r[field])||r[field].length>500||new Set(r[field]).size!==r[field].length||r[field].some(v=>!id(v)||(kind===type&&v===e.id))))fail('Connection targets must be unique IDs, excluding this record.');for(const [field,max] of [['type',120],['description',4000],['history',6000]])if(r[field]!==undefined&&!text(r[field],max))fail('Connection text exceeds its field limit.');
   for(const field of ['formerTargets','formerEraTargets','formerEcosystemTargets'])if(r[field]!==undefined&&(!Array.isArray(r[field])||r[field].length>500||new Set(r[field].map(t=>t?.id)).size!==r[field].length||r[field].some(t=>!object(t)||!id(t.id)||!text(t.title,120))))fail('Invalid former connection target.');
   if(r.selectionNotes!==undefined){if(!object(r.selectionNotes))fail('Invalid connection notes.');for(const [field,notes] of Object.entries(r.selectionNotes))if(!['entryIds','eraIds'].includes(field)||!Array.isArray(notes)||notes.length>500||notes.some(n=>!text(n,120)||!n.trim()))fail('Invalid unlinked connection notes.');}
  }}
  if(e.livedEraIds!==undefined&&(!Array.isArray(e.livedEraIds)||e.livedEraIds.length>500||new Set(e.livedEraIds).size!==e.livedEraIds.length||e.livedEraIds.some(v=>!id(v))))fail('Choose up to 500 unique eras lived through.');
  if(e.livedEraNames!==undefined&&(!object(e.livedEraNames)||Object.keys(e.livedEraNames).length>500||Object.entries(e.livedEraNames).some(([k,v])=>!id(k)||!text(v,120))))fail('Invalid remembered era names.');
 }
 function deletion(e,target,kind='entry'){
  const next=structuredClone(e);let changed=false;
  for(const collection of collections(next))for(const row of collection){const field=kind==='ecosystem'?'ecosystemIds':kind==='era'?'eraIds':'entryIds',ids=row[field]||[];if(!ids.includes(target.id))continue;changed=true;const former=kind==='ecosystem'?'formerEcosystemTargets':kind==='era'?'formerEraTargets':'formerTargets';row[field]=ids.filter(id=>id!==target.id);row[former]=[...(row[former]||[]).filter(t=>t.id!==target.id),{id:target.id,title:target.name||target.title}];if(kind==='entry'&&Object.hasOwn(row,'entryId'))row.entryId=row.entryIds[0]||null;}
  if(kind==='era'&&next.livedEraIds?.includes(target.id)){changed=true;next.livedEraNames={...next.livedEraNames,[target.id]:target.name};}
  return changed?next:e;
 }
 function mentions(e){const refs=new Map();function visit(owner){if(!object(owner))return;for(const [field,registry] of [['description',owner.descriptionReferences],['summary',owner.summaryReferences],...Object.entries(owner.textReferences||{})])for(const r of registry?.items||[])if(typeof owner[field]==='string'&&owner[field].includes(r.token))refs.set(key(r.entryId,r.kind||'entry'),r);for(const [k,v] of Object.entries(owner)){if(['descriptionReferences','summaryReferences','textReferences'].includes(k))continue;if(Array.isArray(v))v.forEach(visit);else if(object(v))visit(v);}}visit(e);return [...refs.values()];}
 // Common questions are present in ordinary sections; suggestions are niche extras.
 const standardGroups={
  Characters:[['People & relationships',['Mentors','Students','Allies','Rivals','Dependants']]],
  Factions:[['Support & associations',['Patrons','Supported causes','Associated magic','Significant events']]],
  Locations:[['Origins & associations',['Founders','Visiting groups','Associated creatures','Associated magic','Significant events']]],
  Magic:[['Practitioners & teaching',['Users / practitioners','Taught by']],['Origins & associations',['Created / discovered by','Practiced at','Associated factions','Related magic']]],
  Creatures:[['Habitat & interactions',['Found at','Associated groups','Interacts with','Threats']],['Magic & significance',['Associated magic','Significant events']]],
  History:[['Causes & consequences',['Causes','Consequences']],['Other participants & related events',['Related events','Involved creatures','Involved magic']]],
  Eras:[['Events & associations',['Defining events','Associated factions / cultures','Important locations','Related eras']]]
 };
 const suggestedFields={
  Characters:['Oaths sworn','Bound to','Unusual influences'],
  Factions:['Secret sponsors','Splinter groups','Oaths and pacts'],
  Locations:['Hidden connections','Cursed by','Seasonal visitors'],
  Magic:['Incompatible with','Restricted by','Transformed by','Resonates with'],
  Creatures:['Symbiotic with','Bound to','Worshipped by'],
  History:['Disputed accounts','Hidden instigators','Alternate interpretations'],
  Eras:['Competing chronologies','Recurring cycles','Forgotten legacies']
 };
 const categoryKey=category=>category==='Bestiary'?'Creatures':category;
 function standardGroupsFor(category){const key=categoryKey(category);return (Object.hasOwn(standardGroups,key)?standardGroups[key]:[['Associations',['Associated with','Created by','Found at','Significant events']]]).map(([title,fields])=>[title,[...fields]]);}
 function suggestionsFor(category){const key=categoryKey(category);return [...(Object.hasOwn(suggestedFields,key)?suggestedFields[key]:['Secret associations','Unusual influences'])];}
 function hasContent(r){return !!(r.entryIds?.length||r.entryId||r.eraIds?.length||r.ecosystemIds?.length||Object.values(r.selectionNotes||{}).some(a=>a.length)||r.formerTargets?.length||r.formerEraTargets?.length||r.formerEcosystemTargets?.length||r.formerName||r.description?.trim()||r.history?.trim());}
 const api={standardGroupsFor,hasContent,suggestionsFor,key,rows,collections,normalize,validate,deletion,mentions};if(typeof module!=='undefined')module.exports=api;else root.ConnectionModel=api;
})(globalThis);

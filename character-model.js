/* Optional character lore shared by the UI, local saves and backup validation. */
(function(root){
 const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const types={person:'Person',deity:'Deity',spirit:'Spirit',sentient:'Sentient being',other:'Other'};
 const statuses={alive:'Alive',deceased:'Deceased',missing:'Missing',imprisoned:'Imprisoned',unknown:'Unknown'};
 // [key, label, maximum length, multiline]. Shared title/summary/description/image stay on the entry.
 const groups=[
  ['Identity & life',[
   ['aliases','Aliases & nicknames',500],['titles','Titles & honorifics',500],['species','Species',120],['ancestry','Ancestry',1000],['age','Age',120],['birthDate','Date of birth',120],['deathDate','Date of death',120],['gender','Gender',120],['pronouns','Pronouns',120]]],
  ['Appearance',[
   ['height','Height',120],['build','Build',500],['eyes','Eye color',120],['hair','Hair',500],['features','Skin, scales, fur & other features',3000,true],['marks','Scars, tattoos & identifying marks',3000,true],['clothing','Clothing & accessories',3000,true]]],
  ['Personality & voice',[
   ['traits','Personality traits',3000,true],['virtues','Virtues',2000,true],['flaws','Flaws',2000,true],['likes','Likes',2000,true],['dislikes','Dislikes',2000,true],['fears','Fears & weaknesses',3000,true],['habits','Habits & mannerisms',3000,true],['beliefs','Beliefs, values & worldview',4000,true],['speech','Speech patterns & accent',2000,true],['quotes','Notable quotes',4000,true]]],
  ['Background & milestones',[
   ['origin','Origin',3000,true],['childhood','Childhood & family background',6000,true],['education','Education & formative experiences',4000,true],['lifeEvents','Significant life events',6000,true],['achievements','Achievements & personal milestones',4000,true],['failures','Failures & regrets',4000,true]]],
  ['Goals & inner life',[
   ['goals','Goals & ambitions',4000,true],['needs','Immediate needs',3000,true],['aspirations','Long-term aspirations',4000,true],['conflicts','Internal conflicts & external obstacles',4000,true],['secrets','Secrets & hidden agendas',6000,true],['development','Character development & legacy',6000,true]]],
  ['Work, abilities & standing',[
   ['occupation','Occupations & professions',500],['rank','Ranks & positions',500],['reputation','Reputation & social standing',3000,true],['skills','Skills, talents & specialized knowledge',4000,true],['powers','Magical abilities & supernatural powers',4000,true],['languages','Languages',1000],['possessions','Possessions & equipment notes',4000,true]]]
 ];
 const fields=groups.flatMap(([,fields])=>fields);
 const singles={birthplaceId:'Birthplace',homeId:'Home',currentLocationId:'Current location'};
 const lists={factionIds:'Factions & institutions',eventIds:'Important events',itemIds:'Possessions & equipment',magicIds:'Magic & powers',relatedIds:'Other linked lore'};
 const isCharacter=e=>!!e&&(e.category==='Characters'||object(e.character));
 function read(e){const c=object(e?.character)?e.character:{};return {...c,...Object.fromEntries(fields.map(([key])=>[key,typeof c[key]==='string'?c[key]:''])),type:Object.hasOwn(types,c.type)?c.type:'',status:Object.hasOwn(statuses,c.status)?c.status:'',...Object.fromEntries(Object.keys(singles).map(k=>[k,typeof c[k]==='string'?c[k]:null])),...Object.fromEntries(Object.keys(lists).map(k=>[k,Array.isArray(c[k])?c[k].filter(id=>typeof id==='string'):[]])),relationships:Array.isArray(c.relationships)?c.relationships.filter(object).map(r=>({...r,entryId:typeof r.entryId==='string'?r.entryId:null,formerName:typeof r.formerName==='string'?r.formerName:'',type:typeof r.type==='string'?r.type:'',description:typeof r.description==='string'?r.description:'',history:typeof r.history==='string'?r.history:''})):[],gallery:Array.isArray(c.gallery)?c.gallery.filter(g=>object(g)&&typeof g.image==='string').map(g=>({...g,caption:typeof g.caption==='string'?g.caption:''})):[]};}
 function references(c,id){return Object.keys(singles).some(k=>c[k]===id)||Object.keys(lists).some(k=>c[k].includes(id))||c.relationships.some(r=>r.entryId===id);}
 function deletion(entries,entry){let count=0;return {get count(){return count;},entries:entries.map(e=>{if(!object(e.character))return e;const c=read(e);if(!references(c,entry.id))return e;count++;for(const k of Object.keys(singles))if(c[k]===entry.id)c[k]=null;for(const k of Object.keys(lists))c[k]=c[k].filter(id=>id!==entry.id);c.relationships=c.relationships.map(r=>r.entryId===entry.id?{...r,entryId:null,formerName:entry.title}:r);return {...e,character:c,updatedAt:new Date().toISOString()};})};}
 function validate(entries,imageValid=value=>typeof value==='string'&&/^\/api\/images\/[a-f0-9-]{36}$/.test(value)){
  const byId=new Map(entries.map(e=>[e.id,e]));const fail=message=>{throw new Error(message);};const text=(v,max)=>typeof v==='string'&&v.length<=max;
  for(const e of entries){if(e.character===undefined)continue;const c=e.character;if(!object(c))fail('Character details must be an object.');
   for(const [key,label,max] of fields)if(c[key]!==undefined&&!text(c[key],max))fail(`${label} must be text of up to ${max} characters.`);
   for(const [key,choices] of [['type',types],['status',statuses]])if(c[key]!==undefined&&c[key]!==''&&!Object.hasOwn(choices,c[key]))fail('Choose a supported character type or life status.');
   const reference=(id,location=false)=>{if(id===null||id==='')return;if(!text(id,120)||id===e.id||!byId.has(id)||(location&&!(byId.get(id).category==='Locations'||object(byId.get(id).location))))fail('A character link is missing or invalid. Choose an existing entry or remove the link.');};
   for(const key of Object.keys(singles))if(c[key]!==undefined)reference(c[key],true);
   for(const key of Object.keys(lists))if(c[key]!==undefined){if(!Array.isArray(c[key])||c[key].length>500||new Set(c[key]).size!==c[key].length)fail('Character links must contain up to 500 unique entry IDs.');for(const id of c[key]){if(!id)fail('Empty character link.');reference(id);}}
   if(c.relationships!==undefined){if(!Array.isArray(c.relationships)||c.relationships.length>200)fail('Use up to 200 relationships per character.');for(const r of c.relationships){if(!object(r))fail('Invalid character relationship.');if(r.entryId!==undefined)reference(r.entryId);for(const [key,max] of Object.entries({formerName:120,type:120,description:4000,history:6000}))if(r[key]!==undefined&&!text(r[key],max))fail('Invalid relationship notes.');}}
   if(c.gallery!==undefined){if(!Array.isArray(c.gallery)||c.gallery.length>50||new Set(c.gallery.map(g=>g?.id)).size!==c.gallery.length)fail('Use up to 50 additional character images with unique IDs.');for(const g of c.gallery)if(!object(g)||!text(g.id,120)||!g.id||!g.image||!imageValid(g.image)||(g.caption!==undefined&&!text(g.caption,500)))fail('Invalid additional character image or caption.');}
  }
 }
 const api={types,statuses,groups,fields,singles,lists,isCharacter,read,references,deletion,validate};if(typeof module!=='undefined')module.exports=api;else root.CharacterModel=api;
})(globalThis);

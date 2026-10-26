/* Optional creature lore shared by browser, server and backup validation. */
(function(root){
 const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 // Broad fields apply equally to flora, fauna, fungi and nonphysical beings.
 const groups=[['Identity & classification',[['classification','Classification',120,false]]],['Form & occurrence',[['appearance','Appearance and manifestation',6000,true],['habitat','Habitat and occurrence',6000,true]]],['Nature & life cycle',[['nature','Behavior and nature',6000,true],['lifeCycle','Life cycle and propagation',6000,true]]],['Properties & significance',[['abilities','Abilities and properties',6000,true],['significance','Significance and uses',6000,true]]]];
 const fields=groups.flatMap(([,fields])=>fields),linkFields=fields.filter(f=>f[3]).map(f=>f[0]);
 const isCreature=e=>!!e&&(e.category==='Creatures'||e.category==='Bestiary'||object(e.creature));
 function read(e){const c=object(e?.creature)?e.creature:{};return {...c,...Object.fromEntries(fields.map(([k])=>[k,typeof c[k]==='string'?c[k]:'']))};}
 function validate(entries){for(const e of entries){if(e.creature===undefined)continue;if(!object(e.creature))throw new Error('Creature details must be an object.');for(const [key,label,max] of fields)if(e.creature[key]!==undefined&&(typeof e.creature[key]!=='string'||e.creature[key].length>max))throw new Error(`${label} must be text of up to ${max} characters.`);}}
 // A reversible read projection: no startup DB writes, revision changes or lore rewrites.
 // Keep both categories independent when the destination name is already occupied.
 function rename(state){if(!Array.isArray(state?.categories)||!Array.isArray(state.entries))return state;const old=state.categories.some(c=>c?.name==='Bestiary'),destination=state.categories.find(c=>typeof c?.name==='string'&&c.name.toLowerCase()==='creatures');if(old&&destination)return state;if(!old&&destination?.name!=='Creatures')return state;if(!old&&!state.entries.some(e=>e?.category==='Bestiary'))return state;return {...state,categories:state.categories.map(c=>c?.name==='Bestiary'?{...c,name:'Creatures'}:c),entries:state.entries.map(e=>e?.category==='Bestiary'?{...e,category:'Creatures'}:e)};}
 const api={groups,fields,linkFields,isCreature,read,validate,rename};if(typeof module!=='undefined')module.exports=api;else root.CreatureModel=api;
})(globalThis);

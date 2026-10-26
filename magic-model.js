/* Optional Magic lore shared by the browser, server and backup validator. */
(function(root){
 const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const groups=[['Classification',[['type','Type',120,false]]],['Sources & effects',[
  ['source','Source and requirements',6000,true],['effects','Effects and capabilities',6000,true]
 ]],['Boundaries & consequences',[
  ['limits','Limits and costs',6000,true],['risks','Risks and consequences',6000,true]
 ]],['Context',[['context','History and context',6000,true]]]];
 const fields=groups.flatMap(([,fields])=>fields),linkFields=fields.filter(f=>f[3]).map(f=>f[0]);
 const isMagic=entry=>!!entry&&(entry.category==='Magic'||object(entry.magic));
 function read(entry){const data=object(entry?.magic)?entry.magic:{};return {...data,...Object.fromEntries(fields.map(([key])=>[key,typeof data[key]==='string'?data[key]:'']))};}
 function validate(entries){for(const entry of entries){if(entry.magic===undefined)continue;if(!object(entry.magic))throw new Error('Magic details must be an object.');for(const [key,label,max] of fields){const value=entry.magic[key];if(value!==undefined&&(typeof value!=='string'||value.length>max))throw new Error(`${label} must be text of up to ${max} characters.`);}}}
 const api={groups,fields,linkFields,isMagic,read,validate};if(typeof module!=='undefined')module.exports=api;else root.MagicModel=api;
})(globalThis);

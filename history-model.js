/* Year-based fictional chronology shared by browser, storage and backup validation. */
(function(root){
 const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const eventTypes={war:'War and Conflict',political:'Political Event',treaty:'Treaty and Agreement',revolution:'Revolution and Rebellion',discovery:'Discovery and Invention',disaster:'Natural Disaster',supernatural:'Magical or Supernatural Event',cultural:'Cultural or Religious Event',exploration:'Exploration and Expedition',founding:'Founding or Establishment',personal:'Personal or Character-Related Event',other:'Other'};
 const certainties={confirmed:'Confirmed',approximate:'Approximate',disputed:'Disputed',unknown:'Unknown'};
 const validYear=value=>Number.isInteger(value)&&Math.abs(value)<=999999;
 const isHistory=e=>!!e&&(e.category==='History'||object(e.history));
 function eventTypeLabel(value){return Object.hasOwn(eventTypes,value)?eventTypes[value]:value;}
 function read(e){const h=object(e?.history)?e.history:{},legacy=validYear(e?.year)?{year:e.year,precision:'year'}:null;return {...h,startDate:h.startDate===undefined?legacy:h.startDate,endDate:h.endDate??null,dateCertainty:h.dateCertainty||'',calendar:h.calendar||'',eventType:h.eventType||''};}
 function startYear(e){if(!isHistory(e))return validYear(e?.year)?e.year:null;const h=read(e);return h.dateCertainty==='unknown'?null:h.startDate?.year??null;}
 function compare(a,b){const x=startYear(a),y=startYear(b);if(x===null||y===null)return x===y?a.title.localeCompare(b.title):x===null?1:-1;const ca=isHistory(a)?read(a).calendar:'',cb=isHistory(b)?read(b).calendar:'';return ca.localeCompare(cb)||x-y||a.title.localeCompare(b.title);}
 function validate(entries){for(const e of entries){if(e.history===undefined)continue;const h=e.history;if(!object(h))throw new Error('History details must be an object.');for(const key of ['startDate','endDate']){const date=h[key];if(date===undefined||date===null)continue;if(!object(date)||!validYear(date.year))throw new Error(`${key==='startDate'?'Start':'End'} year must be a whole number between -999999 and 999999.`);if(date.precision!==undefined&&date.precision!=='year')throw new Error('History dates currently support Year precision only.');}
  if(h.dateCertainty!==undefined&&h.dateCertainty!==''&&!Object.hasOwn(certainties,h.dateCertainty))throw new Error('Choose a supported date certainty.');for(const [key,label] of [['calendar','Calendar name'],['eventType','Event type']])if(h[key]!==undefined&&(typeof h[key]!=='string'||h[key].length>120))throw new Error(`${label} must be text of up to 120 characters.`);
  const data=read(e);if(data.dateCertainty==='unknown'&&(data.startDate!==null||data.endDate!==null))throw new Error('Unknown dates must have no start or end year. Clear the dates or choose another certainty.');if(data.startDate&&data.endDate&&data.endDate.year<data.startDate.year)throw new Error('End year cannot be earlier than start year.');if(e.year!==(startYear(e)??''))throw new Error('The legacy year must match the History start year, or be empty when the start is unknown.');
 }}
 function parseYear(value,label){const text=value.trim();if(!text)return null;if(!/^[+-]?\d+$/.test(text)||!validYear(Number(text)))throw new Error(`${label} must be a whole number between -999999 and 999999.`);return Number(text);}
 function label(e){const h=read(e),start=startYear(e);if(h.dateCertainty==='unknown')return 'Date unknown';if(start===null)return '';return `Year ${start}`+(h.endDate?` – Year ${h.endDate.year}`:'')+(h.calendar?` · ${h.calendar}`:'');}
 const api={eventTypeLabel,eventTypes,certainties,validYear,isHistory,read,startYear,compare,validate,parseYear,label};if(typeof module!=='undefined')module.exports=api;else root.HistoryModel=api;
})(globalThis);

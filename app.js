'use strict';
const $ = id => document.getElementById(id);
const categories = ['Characters','Locations','History','Factions'];
const icons = {All:'▦',Characters:'♙',Locations:'⌂',History:'◷',Factions:'⚑'};
const storageKey = 'worldforge.entries.v1';
const sample = [
 ['Characters','Elara Windweaver','A cartographer of forgotten skies, Elara follows the shifting stars beyond the northern mountains. Her maps reveal paths that only appear under moonlight.',['cartographer','wind magic'],''],
 ['Locations','The Whispering Woods','An ancient forest where the trees remember every traveler. At dusk, silver leaves whisper stories of a kingdom lost beneath the roots.',['enchanted','northern realm'],''],
 ['Factions','The Order of the Lantern','Keepers of knowledge and guardians of the old roads. Each member carries a lantern lit from the same eternal flame.',['scholars','guardians'],''],
 ['History','The Sundering','In the year 412, a fracture of wild magic divided the continent. The inland sea rose overnight, leaving the towers of the old capital beneath its waters.',['ancient history','wild magic'],412],
 ['Characters','Thorne Ashford','A former royal guard who now tends a quiet inn at the edge of the wilds. Beneath his easy smile lies a promise he has yet to keep.',['wanderer','hidden past'],''],
 ['Locations','Aurelian, the Sunken City','Golden spires rise from the still waters of the inland sea. Divers return with relics, strange dreams, and tales of lights moving below.',['ruins','inland sea'],''],
 ['History','The First Lantern','After decades of darkness, travelers gathered at the eastern pass and founded the Order of the Lantern, pledging to keep the roads open for everyone.',['new beginnings','the order'],438],
 ['Factions','The Verdant Circle','Herbalists, wardens, and quiet revolutionaries protecting the living world. Their meeting places are marked by a single green ribbon.',['nature','wardens'],'']
].map((e,i)=>({id:`sample-${i}`,category:e[0],title:e[1],description:e[2],tags:e[3],year:e[4],image:'',updatedAt:'2026-01-01T00:00:00.000Z'}));
let entries=[],filter='All',editingId=null,draftImage='',toastTimer,storageBlocked=false,imageLoading=false;
function validEntry(e){return e && typeof e.id==='string' && e.id.length>0 && categories.includes(e.category) && typeof e.title==='string' && e.title.trim().length>0 && e.title.length<=120 && typeof e.description==='string' && e.description.trim().length>0 && e.description.length<=30000 && Array.isArray(e.tags) && e.tags.length<=30 && e.tags.every(t=>typeof t==='string' && t.length<=100) && (e.year==='' || (Number.isInteger(e.year)&&Math.abs(e.year)<=999999)) && typeof e.image==='string' && (!e.image || /^\/api\/images\/[a-f0-9-]{36}$/.test(e.image)) && typeof e.updatedAt==='string' && Number.isFinite(Date.parse(e.updatedAt));}
function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),6500);}
let saving=false;
async function persist(next, nextMaps=Maps.data){
 if(storageBlocked){notify('Storage is not ready. Resolve the message above or reload before saving.');return false;}
 if(saving){notify('A save is already in progress. Please wait.');return false;}
 saving=true;
 try{const state=await LocalAPI.save(next,nextMaps);entries=state.entries;Maps.data=state.maps;return true;}
 catch(error){notify('Unable to save. '+error.message);return false;}finally{saving=false;}
}
async function initialize(){
 storageBlocked=true;$('new-entry').disabled=true;
 const notice=$('storage-notice');notice.hidden=false;notice.textContent='Opening your local library…';
 try{
  let state=await LocalAPI.state();
  const raw=localStorage.getItem(storageKey);
  if(raw!==null){notice.textContent='Checking legacy browser data. Originals and rollback backups will be preserved.';state=await LocalAPI.migrate(raw);}
  if(!state.initialized)state=await LocalAPI.save(sample,[]);
  entries=state.entries;Maps.data=state.maps;storageBlocked=false;notice.hidden=true;
 }catch(error){notice.textContent='Could not open or migrate your library: '+error.message+' Existing browser data has not been deleted. Export legacy browser data below for recovery.';const download=node('button','secondary','Export legacy browser data');download.onclick=()=>{try{const raw=localStorage.getItem(storageKey);if(raw===null)return notify('No legacy browser data found.');downloadText(raw,'worldforge-legacy-original.json');}catch{notify('Browser storage cannot be read.');}};notice.append(download);}
 render();$('new-entry').disabled=storageBlocked;
}
function downloadText(content,name){const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function setFilter(category){Maps.hide();filter=category;if(category==='History')$('sort').value='year';render();}
function render(){
 $('navigation').replaceChildren();['All',...categories].forEach(c=>{const b=node('button',filter===c?'active':'');b.setAttribute('aria-current',filter===c?'page':'false');b.append(node('span','nav-icon',icons[c]),node('span','',c==='All'?'All entries':c),node('span','count',c==='All'?entries.length:entries.filter(e=>e.category===c).length));b.onclick=()=>setFilter(c);$('navigation').append(b);});
 Maps.renderNav();
 $('stats').replaceChildren();categories.forEach(c=>{const b=node('button',`stat ${c.toLowerCase()}`);b.setAttribute('aria-label',`Show ${c}`);b.append(node('span','stat-icon',icons[c]));const d=node('div');d.append(node('strong','',entries.filter(e=>e.category===c).length),node('small','',c));b.append(d);b.onclick=()=>setFilter(c);$('stats').append(b);});
 $('page-title').textContent=filter==='All'?'Your encyclopedia':filter==='History'?'Your historical timeline':filter;
 $('subtitle').textContent=filter==='All'?'Every person, place, and possibility. All connected by you.':({Characters:'The people who give your world a heartbeat.',Locations:'Every place has a story. Give yours a home.',History:'The moments that shaped your world, through the ages.',Factions:'Shared beliefs. Divided loyalties. Stories in the making.'})[filter];
 const query=$('search').value.trim().toLowerCase();const list=entries.filter(e=>(filter==='All'||e.category===filter)&&[e.title,e.description,...e.tags,String(e.year)].join(' ').toLowerCase().includes(query));
 list.sort((a,b)=>$('sort').value==='title'?a.title.localeCompare(b.title):$('sort').value==='year'?(a.year===''?Infinity:a.year)-(b.year===''?Infinity:b.year)||a.title.localeCompare(b.title):b.updatedAt.localeCompare(a.updatedAt));
 $('list-title').textContent=filter==='All'?'All entries':filter==='History'?'Timeline':filter;$('result-count').textContent=`${list.length} ${list.length===1?'entry':'entries'}`;$('entries').className=filter==='History'?'cards timeline':'cards';$('entries').replaceChildren();
 list.forEach(e=>{const card=node('button',`card ${e.category.toLowerCase()}`);card.setAttribute('aria-label',`Open ${e.title}`);const art=node('div','card-art');if(e.image){const img=node('img');img.src=e.image;img.loading='lazy';img.alt='';art.append(img);}else art.append(node('span','',icons[e.category]));const body=node('div','card-body');body.append(node('span','category',e.category));if(e.category==='History'&&e.year!=='')body.append(node('div','year',`Year ${e.year}`));body.append(node('h3','',e.title),node('p','',e.description));const tags=node('div','tags');e.tags.slice(0,3).forEach(t=>tags.append(node('span','tag',t)));body.append(tags);const meta=node('div','card-meta');meta.append(node('span','',`Updated ${new Date(e.updatedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}`),node('span','','↑'));card.append(art,body,meta);card.onclick=()=>showDetail(e.id);$('entries').append(card);});
 $('empty').hidden=list.length>0;$('empty-title').textContent=query?'No entries found':'A new story starts here';$('empty-text').textContent=query?'Try another title, phrase, or tag.':'Create your first entry and bring your world to life.';
}
function imagePreview(){$('image-preview').hidden=!draftImage;$('image-preview').querySelector('img').src=draftImage||'';}
function updateYear(){$('year-label').hidden=$('entry-category').value!=='History';}
function openEditor(id=null){const e=entries.find(e=>e.id===id);editingId=e?.id||null;draftImage=e?.image||'';imageLoading=false;$('save-entry').disabled=false;$('entry-form').reset();$('form-error').textContent='';$('editor-title').textContent=e?'Edit entry':'New entry';$('entry-title').value=e?.title||'';$('entry-category').value=e?.category||(filter==='All'?'Characters':filter);$('entry-description').value=e?.description||'';$('entry-tags').value=e?.tags.join(', ')||'';$('entry-year').value=e?.year??'';imagePreview();updateYear();$('editor').showModal();$('entry-title').focus();}
function showDetail(id){const e=entries.find(e=>e.id===id);if(!e)return;const box=$('detail-content');box.replaceChildren();const head=node('div','dialog-heading');head.append(node('span',`category ${e.category.toLowerCase()}`,e.category));const close=node('button','icon-button','×');close.setAttribute('aria-label','Close entry');close.onclick=()=>$('detail').close();head.append(close);box.append(head,node('h2','',e.title));if(e.category==='History'&&e.year!=='')box.append(node('div','year',`Year ${e.year}`));if(e.image){const img=node('img','detail-image');img.src=e.image;img.alt=e.title;box.append(img);}box.append(node('p','detail-description',e.description));const tags=node('div','tags');e.tags.forEach(t=>tags.append(node('span','tag',t)));box.append(tags);const actions=node('div','dialog-actions');const del=node('button','secondary','Delete entry');del.onclick=async()=>{if(await confirmAction('Delete this entry?',`“${e.title}” will be removed. This cannot be undone. Export a backup first if you want to keep a copy.`,'Delete entry')){if(await persist(entries.filter(x=>x.id!==id))){$('detail').close();render();notify('Entry deleted.');}}};const edit=node('button','primary','Edit entry');edit.onclick=()=>{$('detail').close();openEditor(id);};actions.append(del,edit);box.append(actions);$('detail').showModal();}
function confirmAction(title,message,action){$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-action').textContent=action;$('confirm').returnValue='cancel';$('confirm').showModal();return new Promise(resolve=>$('confirm').addEventListener('close',()=>resolve($('confirm').returnValue==='confirm'),{once:true}));}
$('new-entry').onclick=()=>openEditor();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());$('search').oninput=render;$('sort').onchange=render;$('entry-category').onchange=updateYear;
$('remove-image').onclick=()=>{draftImage='';$('entry-image').value='';imagePreview();};
$('entry-image').onchange=async()=>{const file=$('entry-image').files[0];if(!file)return;$('form-error').textContent='';if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>50*1024*1024){$('form-error').textContent='Please choose a JPG, PNG, WebP, or GIF image no larger than 50 MB.';$('entry-image').value='';return;}imageLoading=true;$('save-entry').disabled=true;try{draftImage=await LocalAPI.upload(file);imagePreview();}catch(error){$('form-error').textContent=error.message;}finally{imageLoading=false;$('save-entry').disabled=false;}};
$('entry-form').onsubmit=async event=>{event.preventDefault();if(imageLoading)return;const tags=[...new Set($('entry-tags').value.split(',').map(x=>x.trim()).filter(Boolean))];const e={id:editingId||crypto.randomUUID(),category:$('entry-category').value,title:$('entry-title').value.trim(),description:$('entry-description').value.trim(),tags,year:$('entry-category').value==='History'&&$('entry-year').value!==''?Number($('entry-year').value):'',image:draftImage,updatedAt:new Date().toISOString()};if(!validEntry(e)){$('form-error').textContent='Please enter a title and description, use at most 30 tags (100 characters each), and a valid whole-number year.';return;}const next=editingId?entries.map(x=>x.id===editingId?e:x):[e,...entries];if(await persist(next)){$('editor').close();filter=e.category;$('search').value='';render();notify(editingId?'Changes saved.':'Entry created.');}else{$('form-error').textContent=$('toast').textContent;}};
$('export').onclick=()=>{const a=node('a');a.href='/api/backup';a.download='worldforge-backup.zip';a.click();notify('Backup download started. Keep the ZIP file somewhere safe and verify the download completes.');};
$('import').onclick=()=>$('backup-file').click();
$('backup-file').onchange=async()=>{
 const file=$('backup-file').files[0];$('backup-file').value='';if(!file)return;
 if(!(await confirmAction('Restore this backup?','ZIP backups replace entries and maps. Legacy JSON version 1 preserves existing maps. The server will validate the backup and create a rollback ZIP before changing records.','Import backup')))return;
 const notice=$('storage-notice');notice.hidden=false;notice.textContent='Validating and restoring backup. Please leave this window open…';
 try{const state=await LocalAPI.restore(file);entries=state.entries;Maps.data=state.maps;storageBlocked=false;$('new-entry').disabled=false;Maps.hide();filter='All';$('search').value='';render();notice.hidden=true;notify('Backup imported successfully. A rollback backup was saved in the data folder.');}
 catch(error){notice.textContent='Restore failed: '+error.message;notify(error.message);}
};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!Maps.visible&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('search').focus();}});
initialize();

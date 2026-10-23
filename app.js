'use strict';
const $ = id => document.getElementById(id);
let categoryDefinitions=structuredClone(Symbols.defaults);
let categories=categoryDefinitions.map(c=>c.name);
const categoryIcon=name=>categoryDefinitions.find(c=>c.name===name)?.icon||'book';
const categoryClass=name=>['Characters','Locations','History','Factions'].includes(name)?name.toLowerCase():'custom-category';
function glyph(name,cls=''){const span=node('span',`glyph ${cls}`);span.innerHTML=Symbols.svg(name);return span;}
function applyCategories(value){categoryDefinitions=value;categories=value.map(c=>c.name);const selected=$('entry-category').value;$('entry-category').replaceChildren(...categories.map(c=>{const option=node('option','',c);option.value=c;return option;}));if(categories.includes(selected))$('entry-category').value=selected;}
function symbolPicker(label,value='pin'){const element=node('fieldset','symbol-picker'),legend=node('legend','',label),grid=node('div','symbol-grid'),name=crypto.randomUUID();element.append(legend,grid);Symbols.markers.forEach(icon=>{const wrapper=node('label','symbol-choice'),radio=node('input');radio.type='radio';radio.name=name;radio.value=icon;radio.checked=icon===value;radio.setAttribute('aria-label',`${icon[0].toUpperCase()+icon.slice(1)} symbol`);wrapper.title=icon;wrapper.append(radio,glyph(icon),node('small','',icon));grid.append(wrapper);});return {element,get value(){return grid.querySelector(':checked')?.value||'pin';},set value(value){grid.querySelectorAll('input').forEach(r=>r.checked=r.value===value);}};}
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
function validEntry(e){return e && typeof e.id==='string' && e.id.length>0 && categories.includes(e.category) && typeof e.title==='string' && e.title.trim().length>0 && e.title.length<=120 && (e.summary===undefined||typeof e.summary==='string'&&e.summary.length<=500) && typeof e.description==='string' && e.description.trim().length>0 && e.description.length<=30000 && Array.isArray(e.tags) && e.tags.length<=30 && e.tags.every(t=>typeof t==='string' && t.length<=100) && (e.year==='' || (Number.isInteger(e.year)&&Math.abs(e.year)<=999999)) && typeof e.image==='string' && (!e.image || /^\/api\/images\/[a-f0-9-]{36}$/.test(e.image)) && typeof e.updatedAt==='string' && Number.isFinite(Date.parse(e.updatedAt));}
function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),6500);}
let saving=false,restoring=false;
async function persist(next, nextMaps=Maps.data, nextCategories=categoryDefinitions){
 if(storageBlocked){notify('Storage is not ready. Resolve the message above or reload before saving.');return false;}
 if(saving){notify('A save is already in progress. Please wait.');return false;}
 saving=true;
 try{const sources=new Map(next.map(e=>[e.id,e]));const mapsWithSnapshots=nextMaps.map(m=>({...m,canvases:m.canvases.map(c=>({...c,pins:c.pins.map(p=>{const source=sources.get(p.entryId);return source?{...p,title:source.title,description:source.description,summary:source.summary||'',image:source.image}:p;})}))}));const state=await LocalAPI.save(next,mapsWithSnapshots,nextCategories);entries=state.entries;Maps.data=state.maps;applyCategories(state.categories);Maps.refreshEntries();return true;}
 catch(error){notify('Unable to save. '+error.message);return false;}finally{saving=false;}
}
async function initialize(){
 storageBlocked=true;$('new-entry').disabled=true;
 const notice=$('storage-notice');notice.hidden=false;notice.textContent='Opening your local library…';
 try{
  let state=await LocalAPI.state();
  const raw=localStorage.getItem(storageKey);
  if(raw!==null){notice.textContent='Checking legacy browser data. Originals and rollback backups will be preserved.';state=await LocalAPI.migrate(raw);}
  if(!state.initialized)state=await LocalAPI.save(sample,[],state.categories);
  applyWorldState(state);
  await refreshWorlds();
  let preferred;try{preferred=localStorage.getItem('worldforge.active-world');}catch{}
  if(preferred&&preferred!=='default'&&worldList.some(w=>w.id===preferred)){try{await switchWorld(preferred);}catch(e){notify('Could not open the selected world. Your original world is open. '+e.message);}}
  storageBlocked=false;notice.hidden=true;
 }catch(error){notice.textContent='Could not open or migrate your library: '+error.message+' Existing browser data has not been deleted. Export legacy browser data below for recovery.';const download=node('button','secondary','Export legacy browser data');download.onclick=()=>{try{const raw=localStorage.getItem(storageKey);if(raw===null)return notify('No legacy browser data found.');downloadText(raw,'worldforge-legacy-original.json');}catch{notify('Browser storage cannot be read.');}};notice.append(download);}
 render();$('new-entry').disabled=storageBlocked;
}
function downloadText(content,name){const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function setFilter(category){if(category==='Locations'){Geography.show();return;}Geography.hide();Maps.hide();filter=category;if(category==='History')$('sort').value='year';render();}
function render(){
 $('navigation').replaceChildren();['All',...categories].forEach(c=>{if(c==='Locations'){$('navigation').append(Geography.nav());return;}const b=node('button',filter===c&&!Maps.visible&&!Geography.visible?'active':'');b.setAttribute('aria-current',filter===c&&!Maps.visible&&!Geography.visible?'page':'false');b.append(glyph(c==='All'?'grid':categoryIcon(c),'nav-icon'),node('span','',c==='All'?'All entries':c),node('span','count',c==='All'?entries.length:entries.filter(e=>e.category===c).length));b.onclick=()=>setFilter(c);$('navigation').append(b);});
 if(!categories.includes('Locations'))$('navigation').append(Geography.nav());
 Maps.renderNav();
 $('stats').replaceChildren();categories.forEach(c=>{const b=node('button',`stat ${categoryClass(c)}`);b.setAttribute('aria-label',`Show ${c}`);b.append(glyph(categoryIcon(c),'stat-icon'));const d=node('div');d.append(node('strong','',entries.filter(e=>e.category===c).length),node('small','',c));b.append(d);b.onclick=()=>setFilter(c);$('stats').append(b);});
 $('page-title').textContent=filter==='All'?'Your encyclopedia':filter==='History'?'Your historical timeline':filter;
 $('subtitle').textContent=filter==='All'?'Every person, place, and possibility. All connected by you.':({Characters:'The people who give your world a heartbeat.',Locations:'Every place has a story. Give yours a home.',History:'The moments that shaped your world, through the ages.',Factions:'Shared beliefs. Divided loyalties. Stories in the making.'})[filter]||'Discover the stories and knowledge of your world.';
 const query=$('search').value.trim().toLowerCase();const list=entries.filter(e=>(filter==='All'||e.category===filter)&&[e.title,e.summary||'',e.description,...e.tags,String(e.year)].join(' ').toLowerCase().includes(query));
 list.sort((a,b)=>$('sort').value==='title'?a.title.localeCompare(b.title):$('sort').value==='year'?(a.year===''?Infinity:a.year)-(b.year===''?Infinity:b.year)||a.title.localeCompare(b.title):b.updatedAt.localeCompare(a.updatedAt));
 $('list-title').textContent=filter==='All'?'All entries':filter==='History'?'Timeline':filter;$('result-count').textContent=`${list.length} ${list.length===1?'entry':'entries'}`;$('entries').className=filter==='History'?'cards timeline':'cards';$('entries').replaceChildren();
 list.forEach(e=>{const card=node('button',`card ${categoryClass(e.category)}`);card.setAttribute('aria-label',`Open ${e.title}`);const art=node('div','card-art');if(e.image){const img=node('img');img.src=e.image;img.loading='lazy';img.alt='';art.append(img);}else art.append(glyph(categoryIcon(e.category)));const body=node('div','card-body');body.append(node('span','category',e.category));if(e.category==='History'&&e.year!=='')body.append(node('div','year',`Year ${e.year}`));body.append(node('h3','',e.title),node('p','',e.summary||e.description));const tags=node('div','tags');e.tags.slice(0,3).forEach(t=>tags.append(node('span','tag',t)));body.append(tags);const meta=node('div','card-meta');meta.append(node('span','',`Updated ${new Date(e.updatedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}`),node('span','','↑'));card.append(art,body,meta);card.onclick=()=>showDetail(e.id);$('entries').append(card);});
 $('empty').hidden=list.length>0;$('empty-title').textContent=query?'No entries found':'A new story starts here';$('empty-text').textContent=query?'Try another title, phrase, or tag.':'Create your first entry and bring your world to life.';
}
function imagePreview(){$('image-preview').hidden=!draftImage;$('image-preview').querySelector('img').src=draftImage||'';}
function updateYear(){Geography.updateEditor();$('year-label').hidden=$('entry-category').value!=='History';}
function openEditor(id=null,options={}){const e=entries.find(e=>e.id===id);editingId=e?.id||null;draftImage=e?.image||'';imageLoading=false;$('save-entry').disabled=false;$('entry-form').reset();$('form-error').textContent='';$('editor-title').textContent=e?'Edit entry':'New entry';$('entry-title').value=e?.title||'';$('entry-category').value=e?.category||options.category||(filter==='All'?(categories.includes('Characters')?'Characters':categories[0]):filter);$('entry-description').value=e?.description||'';$('entry-summary').value=e?.summary||'';$('entry-tags').value=e?.tags.join(', ')||'';$('entry-year').value=e?.year??'';imagePreview();Geography.beginEditor(e,options);updateYear();$('editor').showModal();$('entry-title').focus();}
function renderEntryDetail(e,box,options={}){
 box.replaceChildren();const head=node('div','dialog-heading');head.append(node('span',`category ${categoryClass(e.category)}`,e.category));if(options.close){const close=node('button','icon-button','×');close.setAttribute('aria-label','Close entry');close.onclick=options.close;head.append(close);}if(options.geography){const tools=node('div','detail-heading-tools');for(const [label,icon,handler] of [['Edit location','edit',()=>openEditor(e.id)],['Delete location','trash',()=>deleteEntry(e)]]){const b=node('button','square-button');b.type='button';b.title=label;b.setAttribute('aria-label',label);b.append(glyph(icon));b.onclick=handler;tools.append(b);}head.append(tools);}box.append(head);Geography.breadcrumbs(e,box);box.append(node('h2','entry-detail-title',e.title));if(e.category==='History'&&e.year!=='')box.append(node('div','year',`Year ${e.year}`));if(e.image){const img=node('img','detail-image');img.src=e.image;img.alt=e.title;box.append(img);}if(e.summary)box.append(node('p','entry-detail-summary',e.summary));box.append(node('p','detail-description',e.description));const tags=node('div','tags');e.tags.forEach(t=>tags.append(node('span','tag',t)));box.append(tags);Geography.appendDetails(e,box);
 const actions=node('div','dialog-actions'),del=node('button','secondary',options.geography?'Delete location':'Delete entry');del.onclick=()=>deleteEntry(e);const edit=node('button','primary',options.geography?'Edit location':'Edit entry');edit.onclick=()=>{if($('detail').open)$('detail').close();openEditor(e.id);};actions.append(del,edit);if(!options.geography)box.append(actions);
}
function showDetail(id){const e=entries.find(e=>e.id===id);if(!e)return;renderEntryDetail(e,$('detail-content'),{close:()=>$('detail').close()});if(!$('detail').open)$('detail').showModal();}
async function deleteEntry(e){
 const plan=GeographyModel.deletion(entries,e);let message=`“${e.title}” will be removed. Linked map pins will keep copies of its text and image.`;
 if(plan.children)message+=` Its ${plan.children} direct child location${plan.children===1?'':'s'} will ${plan.parent?`move under “${plan.parent.title}”`:'become top-level locations'}. Their children and stories will be kept.`;
 if(plan.referencing)message+=` Links in ${plan.referencing} location${plan.referencing===1?'':'s'} will be updated. Written travel information will be kept, with a former-destination label where needed.`;
 message+=' Export a backup first if you want to keep the entry.';
 if(!(await confirmAction('Delete this entry?',message,'Delete entry')))return;notify('Saving entry deletion…');
 const nextMaps=Maps.data.map(m=>({...m,canvases:m.canvases.map(c=>({...c,pins:c.pins.map(p=>p.entryId===e.id?{...p,entryId:null,image:e.image,title:e.title,description:e.description,summary:e.summary||''}:p)}))}));
 if(await persist(plan.entries,nextMaps)){if($('detail').open)$('detail').close();Geography.refresh();render();notify('Entry deleted.');}
}
function confirmAction(title,message,action){$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-action').textContent=action;$('confirm').returnValue='cancel';$('confirm').showModal();return new Promise(resolve=>$('confirm').addEventListener('close',()=>resolve($('confirm').returnValue==='confirm'),{once:true}));}
$('new-entry').onclick=()=>openEditor();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());$('search').oninput=render;$('sort').onchange=render;$('entry-category').onchange=updateYear;
$('remove-image').onclick=()=>{draftImage='';$('entry-image').value='';imagePreview();};
$('entry-image').onchange=async()=>{const file=$('entry-image').files[0];if(!file)return;$('form-error').textContent='';if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>50*1024*1024){$('form-error').textContent='Please choose a JPG, PNG, WebP, or GIF image no larger than 50 MB.';$('entry-image').value='';return;}imageLoading=true;$('save-entry').disabled=true;try{draftImage=await LocalAPI.upload(file);imagePreview();}catch(error){$('form-error').textContent=error.message;}finally{imageLoading=false;$('save-entry').disabled=false;}};
$('entry-form').onsubmit=async event=>{event.preventDefault();if(imageLoading)return;const tags=[...new Set($('entry-tags').value.split(',').map(x=>x.trim()).filter(Boolean))];const e={...entries.find(e=>e.id===editingId),id:editingId||crypto.randomUUID(),category:$('entry-category').value,title:$('entry-title').value.trim(),summary:$('entry-summary').value.trim(),description:$('entry-description').value.trim(),tags,year:$('entry-category').value==='History'&&$('entry-year').value!==''?Number($('entry-year').value):'',image:draftImage,updatedAt:new Date().toISOString()};const location=Geography.collect();if(location)e.location=location;
 if(!validEntry(e)){$('form-error').textContent='Please enter a title and description, use at most 30 tags (100 characters each), and a valid whole-number year.';return;}const next=editingId?entries.map(x=>x.id===editingId?e:x):[e,...entries];try{GeographyModel.validate(next);}catch(error){$('form-error').textContent=error.message;return;}if(await persist(next)){$('editor').close();filter=e.category;$('search').value='';render();if(Geography.visible){if(GeographyModel.isLocation(e))Geography.show(e.id);else Geography.refresh();}notify(editingId?'Changes saved.':'Entry created.');}else{$('form-error').textContent=$('toast').textContent;}};
$('export').onclick=()=>{const a=node('a');a.href='/api/backup?world='+encodeURIComponent(LocalAPI.worldId);a.download=activeWorld().title.replace(/[^a-zA-Z0-9_-]+/g,'-')+'-backup.zip';a.click();notify('Backup of the selected world started. Keep the ZIP file somewhere safe and verify the download completes.');};
$('import').onclick=()=>$('backup-file').click();
$('backup-file').onchange=async()=>{
 const file=$('backup-file').files[0];$('backup-file').value='';if(!file)return;
 if(!(await confirmAction('Restore this backup?',`This replaces entries and maps in “${activeWorld().title}” only. Other worlds are untouched. Legacy JSON version 1 preserves existing maps. A rollback ZIP is saved before changing records.`,'Import backup')))return;
 restoring=true;const notice=$('storage-notice');notice.hidden=false;notice.textContent='Validating and restoring backup. Please leave this window open…';notify('Restoring backup…');
 try{const state=await LocalAPI.restore(file);entries=state.entries;Maps.data=state.maps;applyCategories(state.categories);storageBlocked=false;$('new-entry').disabled=false;Geography.hide();Maps.hide();filter='All';$('search').value='';render();notice.hidden=true;notify('Backup imported successfully. A rollback backup was saved in the data folder.');}
 catch(error){notice.textContent='Restore failed: '+error.message;notify(error.message);}finally{restoring=false;}
};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!Maps.visible&&!Geography.visible&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('search').focus();}});
function manageCategories(){
 const dialog=node('dialog','category-dialog'),form=node('form'),head=node('div','dialog-heading'),close=node('button','icon-button','×');close.type='button';close.setAttribute('aria-label','Close categories');close.onclick=()=>dialog.close();head.append(node('h2','','Your categories'),close);form.append(head,node('p','storage-note','Magic and Bestiary are ready to use. Add categories to organize your own world.'));
 const list=node('div','category-manager-list');form.append(list);let editing=null;
 const label=node('label','','Category name'),name=node('input');name.required=true;name.maxLength=60;label.append(name);form.append(label);const picker=symbolPicker('Category icon','magic');form.append(picker.element);const message=node('p','form-error');message.setAttribute('role','alert');form.append(message);const save=node('button','primary','Add category');save.type='submit';form.append(save);dialog.append(form);document.body.append(dialog);dialog.onclose=()=>dialog.remove();
 function draw(){list.replaceChildren();categoryDefinitions.forEach(c=>{const row=node('div','category-manager-row');row.append(glyph(c.icon),node('span','',c.name));const edit=node('button','square-button');edit.type='button';edit.setAttribute('aria-label',`Edit category ${c.name}`);edit.title=`Edit category ${c.name}`;edit.append(glyph('edit'));edit.onclick=()=>{editing=c.name;name.value=c.name;picker.value=c.icon;save.textContent='Save category';name.focus();};row.append(edit);list.append(row);});}draw();
 form.onsubmit=async e=>{e.preventDefault();const value=name.value.trim();if(!value||value.toLowerCase()==='all'||categoryDefinitions.some(c=>c.name!==editing&&c.name.toLowerCase()===value.toLowerCase())){message.textContent='Choose a unique category name (other than All).';return;}if(categoryDefinitions.length>=100&&!editing){message.textContent='You can have up to 100 categories.';return;}save.disabled=true;const next=editing?categoryDefinitions.map(c=>c.name===editing?{name:value,icon:picker.value}:c):[...categoryDefinitions,{name:value,icon:picker.value}];if(await persist(entries.map(e=>e.category===editing?{...e,category:value,...(GeographyModel.isLocation(e)?{location:GeographyModel.read(e)}:{})}:e),Maps.data,next)){if(filter===editing)filter=value;render();Geography.refresh();editing=null;name.value='';save.textContent='Add category';message.textContent='';draw();notify('Category saved.');}else message.textContent=$('toast').textContent;save.disabled=false;};dialog.showModal();name.focus();
}
$('manage-categories').onclick=manageCategories;
for(const [id,icon,label] of [['export','download','Export backup'],['import','upload','Import backup']]){const b=$(id);b.className='square-button';b.title=label;b.replaceChildren(glyph(icon));}
let worldList=[];
function activeWorld(){return worldList.find(w=>w.id===LocalAPI.worldId)||{id:'default',title:'Your world',description:'A home for your stories.'};}
function renderWorld(){const world=activeWorld();$('sidebar-world-name').textContent=world.title;$('world-banner-title').textContent=world.title;$('world-banner-description').textContent=world.description||'Give your ideas a place to grow.';}
async function refreshWorlds(){worldList=await LocalAPI.request('/api/worlds');renderWorld();}
function applyWorldState(state){entries=state.entries;Maps.data=state.maps;applyCategories(state.categories);Geography.hide();Maps.hide();filter='All';$('search').value='';editingId=null;draftImage='';}
async function switchWorld(id){
 if(saving||imageLoading||restoring)throw new Error('Please wait for the current save or upload to finish.');
 const state=await LocalAPI.request('/api/state',{headers:{'X-Worldforge-World':id}});
 LocalAPI.worldId=id;LocalAPI.accept(state);applyWorldState(state);renderWorld();render();
 try{localStorage.setItem('worldforge.active-world',id);}catch{/* A blocked browser preference does not affect saved world data. */}
}
async function worldDialog(create=false){
 if(storageBlocked||saving||imageLoading||restoring)return notify('Please wait until your library is ready.');
 try{await refreshWorlds();}catch(e){notify('Could not open worlds. '+e.message);return;}
 if(document.querySelector('.world-dialog[open]'))return;
 const dialog=node('dialog','world-dialog'),form=node('form'),head=node('div','dialog-heading'),close=node('button','icon-button','×');close.type='button';close.title='Close worlds';close.setAttribute('aria-label','Close worlds');close.onclick=()=>dialog.close();head.append(node('h2','','Your worlds'),close);form.append(head,node('p','storage-note','Each world has its own entries, categories, maps, and pictures.'));
 const list=node('div','world-list');form.append(list);let creating=create;
 const nameLabel=node('label','','World name'),name=node('input');name.required=true;name.maxLength=120;name.id='world-name';nameLabel.append(name);
 const descriptionLabel=node('label','','World description'),description=node('textarea');description.maxLength=3000;description.rows=3;description.id='world-description';descriptionLabel.append(description);
 const error=node('p','form-error');error.setAttribute('role','alert');const actions=node('div','dialog-actions'),add=node('button','square-button'),save=node('button','primary');add.type='button';add.title='Add world';add.setAttribute('aria-label','Add world');add.append(glyph('plus'));save.type='submit';actions.append(add,save);form.append(nameLabel,descriptionLabel,error,actions);dialog.append(form);document.body.append(dialog);dialog.onclose=()=>dialog.remove();
 function draw(){const current=activeWorld();list.replaceChildren();for(const world of worldList){const b=node('button','world-choice'+(world.id===current.id?' selected':''));b.type='button';b.setAttribute('aria-label',`Open world ${world.title}`);b.setAttribute('aria-pressed',String(world.id===current.id));b.append(glyph('map'),node('span','',world.title));b.onclick=async()=>{setBusy(true);try{await switchWorld(world.id);dialog.close();notify(`Opened ${world.title}.`);}catch(e){error.textContent=e.message;setBusy(false);}};list.append(b);}name.value=creating?'':current.title;description.value=creating?'':current.description;save.textContent=creating?'Create world':'Save world details';}
 function setBusy(value){dialog.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=value);dialog.oncancel=e=>{if(value)e.preventDefault();};}
 add.onclick=()=>{creating=true;error.textContent='';draw();name.focus();};
 form.onsubmit=async event=>{event.preventDefault();const value={title:name.value.trim(),description:description.value.trim(),revision:activeWorld().revision};if(!value.title){error.textContent='Please give your world a name.';return;}setBusy(true);error.textContent='';try{const world=await LocalAPI.request(creating?'/api/worlds':'/api/world',{method:creating?'POST':'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});await refreshWorlds();if(creating)await switchWorld(world.id);dialog.close();notify(creating?'New world created. Start with your first entry.':'World details saved.');}catch(e){error.textContent=e.message;setBusy(false);}};
 draw();dialog.showModal();name.focus();
}
for(const [id,icon,handler] of [['edit-world','edit',()=>worldDialog()],['banner-switch-world','map',()=>worldDialog()],['add-world','plus',()=>worldDialog(true)]]){$(id).append(glyph(icon));$(id).onclick=handler;}
$('switch-world').onclick=()=>worldDialog();
initialize();

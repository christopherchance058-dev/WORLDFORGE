/* Maps share the encyclopedia's atomic localStorage document and backup format.
   Coordinates are fractions of the image, never viewport pixels. */
const Maps = (() => {
  const colors = {gold:'#e8bc66',green:'#76c99b',blue:'#77b7ee',red:'#ef8585',purple:'#bb9aee'};
  let data=[], visible=false, currentId=null, mode='browse', movingId=null;
  let zoom=1, panX=0, panY=0, drag=null;
  const el=id=>document.getElementById(id);
  const current=()=>data.find(m=>m.id===currentId);
  const text=(s,max,required=false)=>typeof s==='string'&&s.length<=max&&(!required||s.trim().length>0);
  function validCollection(maps){
    return Array.isArray(maps)&&new Set(maps.map(m=>m?.id)).size===maps.length&&maps.every(m=>
      m&&text(m.id,120,true)&&text(m.title,120,true)&&text(m.description,30000)&&
      typeof m.image==='string'&&m.image.length<=2800000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(m.image)&&
      typeof m.updatedAt==='string'&&Number.isFinite(Date.parse(m.updatedAt))&&Array.isArray(m.pins)&&new Set(m.pins.map(p=>p?.id)).size===m.pins.length&&m.pins.every(p=>
        p&&text(p.id,120,true)&&text(p.title,120,true)&&text(p.description,10000)&&Object.hasOwn(colors,p.color)&&
        Number.isFinite(p.x)&&p.x>=0&&p.x<=1&&Number.isFinite(p.y)&&p.y>=0&&p.y<=1));
  }
  function decodeImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.naturalWidth*image.naturalHeight<=40000000?resolve(image):reject(new Error('Map images must be at most 40 million pixels.'));image.onerror=()=>reject(new Error('The map image cannot be opened. Choose a valid PNG, JPEG, or WebP.'));image.src=src;});}
  function button(label,fn,cls='secondary'){const b=node('button',cls,label);b.type='button';b.onclick=fn;return b;}
  function error(message){el('map-message').textContent=message;}
  function save(next){if(!persist(entries,next)){error('Unable to save. Browser storage may be full or unavailable, or your world changed in another tab. Export a backup; try a smaller image or reload after copying unsaved text.');return false;}error('');return true;}
  function updateMap(map){map.updatedAt=new Date().toISOString();return save(data.map(m=>m.id===map.id?map:m));}
  function renderNav(){const b=button('◇  Maps',show,'maps-nav');b.classList.toggle('active',visible);b.setAttribute('aria-current',visible?'page':'false');el('navigation').append(b);}
  function show(){visible=true;el('workspace-section').textContent='Maps';el('encyclopedia').hidden=true;el('maps-section').hidden=false;document.querySelectorAll('#navigation button').forEach(b=>b.classList.remove('active'));el('navigation').querySelector('.maps-nav')?.classList.add('active');collection();}
  function hide(){visible=false;el('workspace-section').textContent='Encyclopedia';currentId=null;mode='browse';el('maps-section').hidden=true;el('encyclopedia').hidden=false;}
  function refresh(){if(visible)collection();}
  function frame(){const root=el('maps-section');root.replaceChildren();const msg=node('p','form-error');msg.id='map-message';msg.setAttribute('role','alert');root.append(msg);return root;}
  function collection(){currentId=null;mode='browse';const root=frame();const head=node('div','heading-row');const title=node('div');title.append(node('p','eyebrow','CHART YOUR WORLD'),node('h1','','Your maps'),node('p','subtitle','From distant continents to the room at the end of the corridor.'));head.append(title,button('New map',()=>editMap(), 'primary'));root.append(head,node('p','storage-note','Maps and images save in this browser. Storage is limited (often about 5 MB total). Use small images and export backups regularly.'));
    const grid=node('div','map-collection');root.append(grid);
    if(!data.length)grid.append(node('p','empty','Your atlas starts here. Create a map and upload an image to place your first pin.'));
    data.forEach(m=>{const card=button('',()=>openMap(m.id),'map-card');const img=node('img');img.src=m.image;img.alt='';card.append(img,node('h2','',m.title),node('p','',m.description||'An uncharted story'),node('small','',`${m.pins.length} pins`));grid.append(card);});
  }
  function makeDialog(title){const dialog=node('dialog','maps-dialog');const form=node('form');form.append(node('h2','',title));const message=node('p','form-error');message.setAttribute('role','alert');dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});return {dialog,form,message};}
  function field(form,label,value='',type='input',max=120){const wrapper=node('label','',label);const input=node(type);input.value=value;input.maxLength=max;wrapper.append(input);form.append(wrapper);return input;}
  function actions(form,dialog,message,label){form.append(message);const row=node('div','dialog-actions');const submit=node('button','primary',label);submit.type='submit';row.append(button('Cancel',()=>dialog.close()),submit);form.append(row);return submit;}
  function editMap(map=null){
    const {dialog,form,message}=makeDialog(map?'Edit map':'Create map');
    const title=field(form,'Map title',map?.title||'');title.required=true;
    const description=field(form,'Map description (optional)',map?.description||'','textarea',30000);
    let image=map?.image||'',loading=false;
    if(!map){const label=node('label','','Map image');const file=node('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.required=true;label.append(file);form.append(label,node('p','storage-note','PNG, JPEG or WebP, up to 2 MB and 40 million pixels. Images share limited browser storage with your entries.'));
      file.onchange=async()=>{image='';message.textContent='';const selected=file.files[0];if(!selected)return;
        if(!['image/png','image/jpeg','image/webp'].includes(selected.type)||selected.size>2*1024*1024){message.textContent='Choose a PNG, JPEG or WebP image no larger than 2 MB.';file.value='';return;}
        loading=true;submit.disabled=true;
        try{const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read this file.'));reader.readAsDataURL(selected);});await decodeImage(src);image=src;message.textContent='Image ready. Large images can fill browser storage quickly.';}catch(e){message.textContent=e.message;file.value='';}finally{loading=false;submit.disabled=false;}
      };
    }
    const submit=actions(form,dialog,message,'Save map');
    form.onsubmit=e=>{e.preventDefault();if(loading)return;if(!title.value.trim()||!image){message.textContent='Enter a map title and choose a valid image.';return;}
      const result={id:map?.id||crypto.randomUUID(),title:title.value.trim(),description:description.value.trim(),image,pins:map?.pins||[],updatedAt:new Date().toISOString()};
      if(save(map?data.map(m=>m.id===map.id?result:m):[...data,result])){dialog.close();openMap(result.id);}else message.textContent=el('map-message').textContent;
    };
    dialog.showModal();title.focus();
  }
  function setMode(next,id=null){mode=next;movingId=id;el('map-viewport').dataset.mode=mode;el('add-pin').setAttribute('aria-pressed',String(mode==='add'));el('map-help').textContent=mode==='add'?'Click the image to place a pin. Existing pins still open their information.':mode==='move'?'Click the new position on the image. Cancel tool to keep the original position.':'Click a pin to read or edit it. Drag to pan; use the wheel or buttons to zoom.';el('cancel-tool').hidden=mode==='browse';}
  function openMap(id){currentId=id;zoom=1;panX=0;panY=0;const m=current();if(!m)return collection();const root=frame();const head=node('div','heading-row');const title=node('div');title.append(button('← All maps',collection),node('h1','',m.title),node('p','subtitle',m.description));const controls=node('div','map-actions');controls.append(button('Edit map',()=>editMap(current())),button('Delete map',async()=>{if(await confirmAction('Delete this map?',`Delete “${current().title}” and all its pins? Export a backup first to keep a copy.`,'Delete map'))if(save(data.filter(x=>x.id!==currentId)))collection();}));head.append(title,controls);root.append(head);
    const toolbar=node('div','map-toolbar');const add=button('Add pin',()=>setMode(mode==='add'?'browse':'add'),'primary');add.id='add-pin';const cancel=button('Cancel tool',()=>setMode('browse'));cancel.id='cancel-tool';
    toolbar.append(add,cancel,button('Zoom in',()=>setZoom(zoom*1.25)),button('Zoom out',()=>setZoom(zoom/1.25)),button('Reset view',reset));const level=node('span');level.id='map-zoom';toolbar.append(level);root.append(toolbar);const help=node('p','storage-note');help.id='map-help';root.append(help);
    const layout=node('div','map-layout');const viewport=node('div');viewport.id='map-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','Map canvas. Drag to pan. Use toolbar to add pins and zoom.');const plane=node('div');plane.id='map-plane';const img=node('img');img.id='map-background';img.src=m.image;img.alt=m.title;img.draggable=false;plane.append(img);viewport.append(plane);const panel=node('aside');panel.id='pin-panel';layout.append(viewport,panel);root.append(layout);img.onload=reset;img.onerror=()=>error('The saved map image could not be opened. Export a backup before replacing data.');
    viewport.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*(e.deltaY<0?1.12:1/1.12),e.clientX,e.clientY);},{passive:false});
    viewport.onpointerdown=e=>{if(e.button!==0||e.target.closest('.map-pin')||mode!=='browse')return;drag={x:e.clientX,y:e.clientY,px:panX,py:panY};viewport.setPointerCapture(e.pointerId);};
    viewport.onpointermove=e=>{if(!drag)return;panX=drag.px+e.clientX-drag.x;panY=drag.py+e.clientY-drag.y;transform();};
    viewport.onpointerup=viewport.onpointercancel=()=>{drag=null;};
    viewport.onclick=e=>{if(e.target.closest('.map-pin')||mode==='browse')return;const r=img.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(x<0||x>1||y<0||y>1)return;
      if(mode==='move'){const next=structuredClone(current());const pin=next.pins.find(p=>p.id===movingId);if(!pin)return;if(updateMap({...next,pins:next.pins.map(p=>p.id===pin.id?{...p,x,y}:p)})){setMode('browse');drawPins();showPin(pin.id);}}else editPin(null,{x,y});
    };
    viewport.onkeydown=e=>{if(e.key==='Escape'){setMode('browse');return;}if(e.target!==viewport)return;const moves={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};if(moves[e.key]){e.preventDefault();panX+=moves[e.key][0];panY+=moves[e.key][1];transform();}};
    setMode('browse');drawPins();pinList();transform();
  }
  function transform(){const plane=el('map-plane');if(!plane)return;plane.style.transform=`translate(${panX}px, ${panY}px) scale(${zoom})`;plane.style.setProperty('--map-zoom',zoom);el('map-zoom').textContent=`${Math.round(zoom*100)}%`;}
  function reset(){zoom=1;panX=0;panY=0;transform();}
  function setZoom(value,clientX,clientY){const v=el('map-viewport').getBoundingClientRect();const x=(clientX??v.left+v.width/2)-v.left,y=(clientY??v.top+v.height/2)-v.top;const next=Math.min(5,Math.max(.5,value));panX=x-(x-panX)*next/zoom;panY=y-(y-panY)*next/zoom;zoom=next;transform();}
  function drawPins(){el('map-plane').querySelectorAll('.map-pin').forEach(p=>p.remove());current().pins.forEach(p=>{const b=button('●',e=>{e.stopPropagation();showPin(p.id);},'map-pin');b.setAttribute('aria-label',`Pin: ${p.title}`);b.title=p.title;b.style.left=`${p.x*100}%`;b.style.top=`${p.y*100}%`;b.style.color=colors[p.color];el('map-plane').append(b);});}
  function pinList(){const panel=el('pin-panel');panel.replaceChildren(node('h2','','Map pins'));if(!current().pins.length)panel.append(node('p','','Choose Add pin, then click a place on your map.'));current().pins.forEach(p=>panel.append(button(p.title,()=>showPin(p.id))));}
  function showPin(id){const p=current().pins.find(p=>p.id===id);if(!p)return pinList();const panel=el('pin-panel');panel.replaceChildren(button('All pins',pinList),node('h2','',p.title),node('p','pin-description',p.description||'No description yet.'));panel.append(button('Edit pin',()=>editPin(p)),button('Reposition pin',()=>setMode('move',p.id)),button('Delete pin',async()=>{if(await confirmAction('Delete this pin?',`Remove “${p.title}” from the map?`,'Delete pin')){if(updateMap({...current(),pins:current().pins.filter(x=>x.id!==p.id)})){setMode('browse');drawPins();pinList();}}}));}
  function editPin(pin,position){const {dialog,form,message}=makeDialog(pin?'Edit pin':'New pin');const title=field(form,'Pin title',pin?.title||'');title.required=true;const description=field(form,'Pin description (optional)',pin?.description||'','textarea',10000);const label=node('label','','Pin color');const color=node('select');color.setAttribute('aria-label','Pin color');Object.keys(colors).forEach(c=>{const option=node('option','',c);option.value=c;color.append(option);});color.value=pin?.color||'gold';label.append(color);form.append(label);actions(form,dialog,message,'Save pin');
    form.onsubmit=e=>{e.preventDefault();if(!title.value.trim()){message.textContent='Enter a title for this pin.';return;}const result={id:pin?.id||crypto.randomUUID(),title:title.value.trim(),description:description.value.trim(),color:color.value,x:pin?.x??position.x,y:pin?.y??position.y};const next={...current(),pins:pin?current().pins.map(p=>p.id===pin.id?result:p):[...current().pins,result]};if(updateMap(next)){dialog.close();setMode('browse');drawPins();showPin(result.id);}else message.textContent=el('map-message').textContent;};dialog.showModal();title.focus();
  }
  return {get data(){return data;},set data(value){data=value;},get visible(){return visible;},hide,refresh,renderNav,validCollection,decodeImage};
})();

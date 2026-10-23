/* Each map contains ordered image canvases. Pins belong to a canvas and use
   normalized image coordinates. Images remain immutable server-managed files. */
const Maps=(()=>{
  const colors={gold:'#c89b36',green:'#3f9564',blue:'#418cc4',red:'#ce5d5d',purple:'#9774c5'};
  let data=[],visible=false,currentId=null,canvasId=null,mode='browse',movingId=null;
  let zoom=1,scale=1,panX=0,panY=0,naturalWidth=0,naturalHeight=0,viewWidth=0,viewHeight=0;
  let gesture=null,observer=null,ignoreClickUntil=0,imagesOpen=true,pinsOpen=false,busy=false,ownsFullscreen=false;
  const el=id=>document.getElementById(id);
  const current=()=>data.find(m=>m.id===currentId);
  const canvas=()=>current()?.canvases.find(c=>c.id===canvasId);
  const button=(label,fn,cls='secondary')=>{const b=node('button',cls,label);b.type='button';b.onclick=e=>{if(!busy)return fn(e);};return b;};
  function error(message){if(el('map-message'))el('map-message').textContent=message;}
  function setBusy(value){busy=value;el('maps-section').setAttribute('aria-busy',String(value));el('maps-section').querySelectorAll('button').forEach(b=>b.disabled=value);}
  async function save(next){const wasBusy=busy;setBusy(true);try{if(!(await persist(entries,next))){error(el('toast').textContent);return false;}error('');return true;}finally{setBusy(wasBusy);}}
  async function updateMap(map){return save(data.map(m=>m.id===map.id?{...map,updatedAt:new Date().toISOString()}:m));}
  async function updateCanvas(next){return updateMap({...current(),canvases:current().canvases.map(c=>c.id===next.id?next:c)});}
  function leaveWorkspace(){observer?.disconnect();observer=null;gesture=null;document.body.classList.remove('map-editing');el('maps-section').classList.remove('map-workspace');if(ownsFullscreen&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});ownsFullscreen=false;}
  function renderNav(){const b=button('◇  Maps',show,'maps-nav');b.classList.toggle('active',visible);b.setAttribute('aria-current',visible?'page':'false');el('navigation').append(b);}
  function show(){visible=true;el('workspace-section').textContent='Maps';el('encyclopedia').hidden=true;el('maps-section').hidden=false;document.querySelectorAll('#navigation button').forEach(b=>b.classList.remove('active'));el('navigation').querySelector('.maps-nav')?.classList.add('active');collection();}
  function hide(){leaveWorkspace();visible=false;currentId=null;canvasId=null;el('workspace-section').textContent='Encyclopedia';el('maps-section').hidden=true;el('encyclopedia').hidden=false;}
  function refresh(){if(visible)collection();}
  function frame(){const root=el('maps-section');root.replaceChildren();return root;}
  function message(root){const msg=node('p','form-error');msg.id='map-message';msg.setAttribute('role','alert');root.append(msg);}
  function collection(){
    leaveWorkspace();currentId=null;canvasId=null;const root=frame(),head=node('div','heading-row'),title=node('div');
    title.append(node('p','eyebrow','CHART YOUR WORLD'),node('h1','','Your maps'),node('p','subtitle','Worlds, cities and rooms. One atlas, many perspectives.'));
    head.append(title,button('New map',()=>editMap(),'primary'));root.append(head);message(root);
    root.append(node('p','storage-note','Original images and their pins save on this computer. Export ZIP backups regularly.'));
    const grid=node('div','map-collection');root.append(grid);
    if(!data.length)grid.append(node('p','empty','Create a map and upload one or more images to begin.'));
    data.forEach(m=>{const card=button('',()=>openMap(m.id),'map-card'),img=node('img');img.src=m.canvases[0].image;img.loading='lazy';img.alt='';card.append(img,node('h2','',m.title),node('p','',m.description||'An uncharted story'),node('small','',`${m.canvases.length} images · ${m.canvases.reduce((n,c)=>n+c.pins.length,0)} pins`));grid.append(card);});
  }
  function makeDialog(title){const dialog=node('dialog','maps-dialog'),form=node('form'),message=node('p','form-error');form.append(node('h2','',title));message.setAttribute('role','alert');dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});return {dialog,form,message};}
  function field(form,label,value='',type='input',max=120){const wrapper=node('label','',label),input=node(type);input.value=value;input.maxLength=max;wrapper.append(input);form.append(wrapper);return input;}
  function actions(form,dialog,message,label){form.append(message);const row=node('div','dialog-actions'),submit=node('button','primary',label);submit.type='submit';row.append(button('Cancel',()=>dialog.close()),submit);form.append(row);return submit;}
  async function uploadFiles(files,report){
    const result=[],failures=[];
    for(const [i,file] of [...files].entries()){
      report(`Uploading ${i+1} of ${files.length}: ${file.name}`);
      try{if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Use PNG, JPEG or WebP.');
        const image=await LocalAPI.upload(file);result.push({id:crypto.randomUUID(),name:file.name.slice(0,120),filename:file.name.slice(0,255),image,pins:[]});
      }catch(e){failures.push(`${file.name}: ${e.message}`);}
    }
    return {canvases:result,failures};
  }
  function editMap(map=null){
    const {dialog,form,message}=makeDialog(map?'Edit map':'Create map');const title=field(form,'Map title',map?.title||'');title.required=true;
    const description=field(form,'Map description (optional)',map?.description||'','textarea',30000);let canvases=map?.canvases||[],loading=false;
    if(!map){const label=node('label','','Map images'),file=node('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.multiple=true;file.required=true;label.append(file);form.append(label,node('p','storage-note','Select several files. Each image gets its own pins. Up to 50 MB and 80 million pixels per image.'));
      file.onchange=async()=>{loading=true;submit.disabled=true;const result=await uploadFiles(file.files,t=>message.textContent=t);canvases=result.canvases;message.textContent=`${canvases.length} image${canvases.length===1?'':'s'} ready. ${result.failures.join(' ')}`;loading=false;submit.disabled=false;};}
    const submit=actions(form,dialog,message,'Save map');
    form.onsubmit=async e=>{e.preventDefault();if(loading)return;if(!title.value.trim()||!canvases.length){message.textContent='Enter a title and upload at least one valid image.';return;}submit.disabled=true;
      const next={id:map?.id||crypto.randomUUID(),title:title.value.trim(),description:description.value.trim(),canvases,updatedAt:new Date().toISOString()};
      if(await save(map?data.map(m=>m.id===map.id?next:m):[...data,next])){dialog.close();openMap(next.id,canvasId);}else message.textContent=el('map-message').textContent;submit.disabled=false;};dialog.showModal();title.focus();
  }
  function setMode(next,id=null){mode=next;movingId=id;el('map-viewport').dataset.mode=mode;el('add-pin').setAttribute('aria-pressed',String(mode==='add'));el('pan-tool').setAttribute('aria-pressed',String(mode==='browse'));el('map-help').textContent=mode==='add'?'Click the image to place a pin. Existing pins open their information.':mode==='move'?'Click the new position. Cancel tool keeps the original position.':'Drag the image to pan, or drag a pin to move it. Changes save automatically.';el('cancel-tool').hidden=mode==='browse';}
  function applyPanels(){const layout=el('map-layout');layout.classList.toggle('images-collapsed',!imagesOpen);layout.classList.toggle('pins-collapsed',!pinsOpen);el('canvas-panel').hidden=!imagesOpen;el('pin-panel').hidden=!pinsOpen;el('toggle-images').setAttribute('aria-expanded',String(imagesOpen));el('toggle-pins').setAttribute('aria-expanded',String(pinsOpen));}
  function openMap(id,selected=null){
    observer?.disconnect();currentId=id;const m=current();if(!m)return collection();canvasId=m.canvases.some(c=>c.id===selected)?selected:m.canvases[0].id;
    imagesOpen=innerWidth>=800;pinsOpen=false;const root=frame();root.classList.add('map-workspace');document.body.classList.add('map-editing');
    const toolbar=node('div','map-toolbar');toolbar.append(button('Exit editor',collection));const title=node('h1','workspace-title',m.title);toolbar.append(title);
    const toggleImages=button('Images',()=>{imagesOpen=!imagesOpen;if(imagesOpen&&innerWidth<800)pinsOpen=false;applyPanels();});toggleImages.id='toggle-images';
    const togglePins=button('Pin details',()=>{pinsOpen=!pinsOpen;if(pinsOpen&&innerWidth<800)imagesOpen=false;applyPanels();});togglePins.id='toggle-pins';
    const add=button('Add pin',()=>setMode(mode==='add'?'browse':'add'),'primary');add.id='add-pin';
    const pan=button('Pan',()=>setMode('browse'));pan.id='pan-tool';
    const cancel=button('Cancel tool',()=>setMode('browse'));cancel.id='cancel-tool';
    toolbar.append(toggleImages,togglePins,add,pan,cancel,button('Zoom in',()=>setZoom(zoom*1.25)),button('Zoom out',()=>setZoom(zoom/1.25)),button('Reset view',reset),button('Save',async()=>{if(await updateMap(current()))notify('Map saved.');}),button('Edit map',()=>editMap(current())),button('Delete map',async()=>{if(await confirmAction('Delete this map?',`Delete “${current().title}” and every image canvas and pin? Original image files remain in the library.`,'Delete map'))if(await save(data.filter(m=>m.id!==currentId)))collection();}));
    if(document.fullscreenEnabled)toolbar.append(button('Browser fullscreen',async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();ownsFullscreen=false;}else{await document.documentElement.requestFullscreen();ownsFullscreen=true;}}catch{error('Browser fullscreen is unavailable. The editor still fills the application viewport.');}}));
    toolbar.append(Theme.control());root.append(toolbar);message(root);
    const help=node('p','storage-note');help.id='map-help';root.append(help);
    const layout=node('div','map-layout');layout.id='map-layout';const imagePanel=node('aside');imagePanel.id='canvas-panel';
    const viewport=node('div');viewport.id='map-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','Map canvas. Drag to pan. Use toolbar to add pins and zoom.');
    const plane=node('div');plane.id='map-plane';const img=node('img');img.id='map-background';img.draggable=false;plane.append(img);viewport.append(plane);
    const pinPanel=node('aside');pinPanel.id='pin-panel';layout.append(imagePanel,viewport,pinPanel);root.append(layout);
    const footer=node('div','workspace-footer');const active=node('span');active.id='active-canvas';const level=node('span');level.id='map-zoom';footer.append(active,level);root.append(footer);
    bindPointer(viewport);renderImages();applyPanels();switchCanvas(canvasId);
    observer=new ResizeObserver(()=>fit(true));observer.observe(viewport);
  }
  function switchCanvas(id){if(busy)return;canvasId=id;gesture=null;zoom=1;naturalWidth=0;naturalHeight=0;viewWidth=0;viewHeight=0;setMode('browse');const c=canvas(),img=el('map-background');img.onload=()=>{naturalWidth=img.naturalWidth;naturalHeight=img.naturalHeight;reset();};img.onerror=()=>error('The saved image could not be opened. Restore it from a backup.');img.src=c.image;img.alt=c.name;el('active-canvas').textContent=c.name;drawPins();pinList();renderImages();if(img.complete&&img.naturalWidth){naturalWidth=img.naturalWidth;naturalHeight=img.naturalHeight;reset();}}
  function fit(preserve=false){
    if(!naturalWidth||!el('map-viewport'))return;const v=el('map-viewport'),w=v.clientWidth,h=v.clientHeight;if(!w||!h)return;
    const cx=preserve&&viewWidth?(viewWidth/2-panX)/scale:naturalWidth/2,cy=preserve&&viewHeight?(viewHeight/2-panY)/scale:naturalHeight/2;
    scale=Math.min(w/naturalWidth,h/naturalHeight)*zoom;panX=w/2-cx*scale;panY=h/2-cy*scale;viewWidth=w;viewHeight=h;
    el('map-plane').style.width=`${naturalWidth}px`;el('map-plane').style.height=`${naturalHeight}px`;transform();
  }
  function transform(){const plane=el('map-plane');if(!plane)return;plane.style.transform=`translate(${panX}px, ${panY}px) scale(${scale})`;plane.style.setProperty('--map-zoom',scale);el('map-zoom').textContent=`${Math.round(zoom*100)}% of fit`;}
  function reset(){zoom=1;fit(false);}
  function setZoom(value,clientX,clientY){if(!naturalWidth)return;const r=el('map-viewport').getBoundingClientRect(),x=(clientX??r.left+r.width/2)-r.left,y=(clientY??r.top+r.height/2)-r.top,next=Math.min(10,Math.max(.25,value)),ratio=next/zoom;panX=x-(x-panX)*ratio;panY=y-(y-panY)*ratio;scale*=ratio;zoom=next;transform();}
  function position(e,clamp=false){const r=el('map-background').getBoundingClientRect();let x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(!Number.isFinite(x)||!Number.isFinite(y))return null;if(clamp){x=Math.min(1,Math.max(0,x));y=Math.min(1,Math.max(0,y));}return x>=0&&x<=1&&y>=0&&y<=1?{x,y}:null;}
  async function movePin(id,point){const c=canvas();if(!c||!point)return;setBusy(true);try{if(await updateCanvas({...c,pins:c.pins.map(p=>p.id===id?{...p,...point}:p)})){setMode('browse');drawPins();showPin(id);}else drawPins();}finally{setBusy(false);}}
  function bindPointer(viewport){
    viewport.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*(e.deltaY<0?1.12:1/1.12),e.clientX,e.clientY);},{passive:false});
    viewport.onpointerdown=e=>{if(e.button!==0||busy)return;const pin=e.target.closest('.map-pin');if(mode!=='browse')return;gesture={kind:pin?'pin':'pan',id:pin?.dataset.pin,x:e.clientX,y:e.clientY,px:panX,py:panY,moved:false};viewport.setPointerCapture(e.pointerId);};
    viewport.onpointermove=e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>4)gesture.moved=true;if(!gesture.moved)return;if(gesture.kind==='pan'){panX=gesture.px+dx;panY=gesture.py+dy;transform();}else{const p=position(e,true);const marker=[...el('map-plane').querySelectorAll('.map-pin')].find(b=>b.dataset.pin===gesture.id);if(marker&&p){marker.style.left=`${p.x*100}%`;marker.style.top=`${p.y*100}%`;}}};
    viewport.onpointerup=async e=>{if(!gesture)return;const g=gesture;gesture=null;if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);if(g.moved){ignoreClickUntil=performance.now()+350;if(g.kind==='pin')await movePin(g.id,position(e,true));}else if(g.kind==='pin'){showPin(g.id);ignoreClickUntil=performance.now()+350;}};
    viewport.onpointercancel=()=>{gesture=null;drawPins();};
    viewport.onclick=e=>{if(busy||performance.now()<ignoreClickUntil||e.target.closest('.map-pin')||mode==='browse')return;const p=position(e);if(!p)return;if(mode==='move')movePin(movingId,p);else editPin(null,p);};
    viewport.onkeydown=e=>{if(e.key==='Escape'){setMode('browse');return;}if(e.target!==viewport)return;const moves={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};if(moves[e.key]){e.preventDefault();panX+=moves[e.key][0];panY+=moves[e.key][1];transform();}};
  }
  function drawPins(){el('map-plane').querySelectorAll('.map-pin').forEach(p=>p.remove());canvas().pins.forEach(p=>{const b=button('●',e=>{e.stopPropagation();if(performance.now()>=ignoreClickUntil)showPin(p.id);},'map-pin');b.dataset.pin=p.id;b.setAttribute('aria-label',`Pin: ${p.title}`);b.title=p.title;b.style.left=`${p.x*100}%`;b.style.top=`${p.y*100}%`;b.style.color=colors[p.color];el('map-plane').append(b);});}
  function pinList(){const panel=el('pin-panel');panel.replaceChildren(node('h2','','Image pins'));if(!canvas().pins.length)panel.append(node('p','','Choose Add pin, then click a place on this image.'));canvas().pins.forEach(p=>panel.append(button(p.title,()=>showPin(p.id))));}
  function showPin(id){const p=canvas().pins.find(p=>p.id===id);if(!p)return pinList();pinsOpen=true;if(innerWidth<800)imagesOpen=false;applyPanels();const panel=el('pin-panel');panel.replaceChildren(button('All pins',pinList),node('h2','',p.title),node('p','pin-description',p.description||'No description yet.'));panel.append(button('Edit pin',()=>editPin(p)),button('Reposition pin',()=>setMode('move',p.id)),button('Delete pin',async()=>{if(await confirmAction('Delete this pin?',`Remove “${p.title}” from this image?`,'Delete pin'))if(await updateCanvas({...canvas(),pins:canvas().pins.filter(x=>x.id!==p.id)})){setMode('browse');drawPins();pinList();renderImages();}}));}
  function editPin(pin,point){const {dialog,form,message}=makeDialog(pin?'Edit pin':'New pin'),title=field(form,'Pin title',pin?.title||'');title.required=true;const description=field(form,'Pin description (optional)',pin?.description||'','textarea',10000),label=node('label','','Pin color'),color=node('select');color.setAttribute('aria-label','Pin color');Object.keys(colors).forEach(c=>{const option=node('option','',c);option.value=c;color.append(option);});color.value=pin?.color||'gold';label.append(color);form.append(label);const submit=actions(form,dialog,message,'Save pin');
    form.onsubmit=async e=>{e.preventDefault();if(!title.value.trim()){message.textContent='Enter a pin title.';return;}submit.disabled=true;const result={id:pin?.id||crypto.randomUUID(),title:title.value.trim(),description:description.value.trim(),color:color.value,x:pin?.x??point.x,y:pin?.y??point.y};if(await updateCanvas({...canvas(),pins:pin?canvas().pins.map(p=>p.id===pin.id?result:p):[...canvas().pins,result]})){dialog.close();setMode('browse');drawPins();showPin(result.id);renderImages();}else message.textContent=el('map-message').textContent;submit.disabled=false;};dialog.showModal();title.focus();
  }
  function chooseImages(replace=false){const input=node('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.multiple=!replace;input.hidden=true;input.id='map-image-upload';el('maps-section').append(input);input.oncancel=()=>input.remove();input.onchange=async()=>{
      const chosen=[...input.files];input.remove();if(!chosen.length)return;const selected=canvas();
      if(replace&&selected.pins.length&&!(await confirmAction('Replace this image?',`Keep ${selected.pins.length} pins at the same normalized positions? Different artwork may require repositioning them. The original file remains in your library.`,'Replace image')))return;
      setBusy(true);try{const result=await uploadFiles(chosen,error);if(!result.canvases.length){error(result.failures.join(' '));return;}
        const next=replace?current().canvases.map(c=>c.id===selected.id?{...c,image:result.canvases[0].image,filename:result.canvases[0].filename}:c):[...current().canvases,...result.canvases];
        if(await updateMap({...current(),canvases:next})){setBusy(false);switchCanvas(replace?selected.id:result.canvases[0].id);error(result.failures.length?`Some files were not added: ${result.failures.join(' ')}`:'');}
      }finally{setBusy(false);}
    };input.click();}
  function renameImage(){const c=canvas(),{dialog,form,message}=makeDialog('Rename image'),name=field(form,'Image name',c.name);name.required=true;const submit=actions(form,dialog,message,'Save name');form.onsubmit=async e=>{e.preventDefault();if(!name.value.trim()){message.textContent='Enter an image name.';return;}submit.disabled=true;if(await updateCanvas({...c,name:name.value.trim()})){dialog.close();renderImages();el('active-canvas').textContent=canvas().name;}else message.textContent=el('map-message').textContent;submit.disabled=false;};dialog.showModal();}
  async function reorderImage(direction){const list=[...current().canvases],index=list.findIndex(c=>c.id===canvasId),next=index+direction;if(next<0||next>=list.length)return;[list[index],list[next]]=[list[next],list[index]];if(await updateMap({...current(),canvases:list}))renderImages();}
  async function removeImage(){const c=canvas();if(current().canvases.length===1){error('This is the last image. Delete the map to remove it, or add another image first.');return;}if(await confirmAction('Remove this image?',`Remove “${c.name}” and its ${c.pins.length} pins from this map? The original image file stays in the library and backups.`,'Remove image'))if(await updateMap({...current(),canvases:current().canvases.filter(x=>x.id!==c.id)}))switchCanvas(current().canvases[0].id);}
  function renderImages(){const panel=el('canvas-panel');if(!panel)return;panel.replaceChildren(node('h2','','Map images'),button('Add images',()=>chooseImages(),'primary'));const list=node('div','canvas-list');panel.append(list);
    current().canvases.forEach(c=>{const b=button('',()=>switchCanvas(c.id),'canvas-card');b.setAttribute('aria-label',`Select image: ${c.name}`);b.setAttribute('aria-pressed',String(c.id===canvasId));const img=node('img');img.src=c.image;img.loading='lazy';img.alt='';b.append(img,node('strong','',c.name),node('small','',c.filename||'Original image'),node('small','',`${c.pins.length} pins`));list.append(b);});
    const controls=node('div','canvas-actions');controls.append(button('Rename image',renameImage),button('Replace image',()=>chooseImages(true)),button('Move image up',()=>reorderImage(-1)),button('Move image down',()=>reorderImage(1)),button('Remove image',removeImage));panel.append(controls);
  }
  return {get data(){return data;},set data(value){data=value;},get visible(){return visible;},hide,refresh,renderNav};
})();

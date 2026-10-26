/* Reusable, bounded entry-preview stacks. No lore or navigation state is persisted. */
const EntryPreviews=(()=>{
 function mount(root,{getEntries,onRead,blocked=()=>false}){
  let lastPointer=null;function track(event){lastPointer={x:event.clientX,y:event.clientY,time:performance.now()};}root.addEventListener('pointermove',track);
  let stack=[],pending=null,serial=0,disposed=false;const prefix='entry-preview-'+crypto.randomUUID()+'-';
  const key=e=>(e.referenceKind||'entry')+':'+e.id;
  function closeFrom(index){if(index<0)return;for(const item of stack.splice(index)){clearTimeout(item.closeTimer);clearTimeout(item.lockTimer);item.source.removeAttribute('aria-describedby');item.source.classList.remove('preview-source');item.box.remove();}}
  function clear(){clearTimeout(pending);pending=null;closeFrom(0);}
  function leave(){clearTimeout(pending);pending=null;const item=stack.at(-1);if(item&&!item.locked){clearTimeout(item.closeTimer);const start=lastPointer;item.closeTimer=setTimeout(()=>{if(item.box.matches(':hover')||pending)return;const rect=item.box.getBoundingClientRect(),distance=p=>Math.hypot(Math.max(rect.left-p.x,0,p.x-rect.right),Math.max(rect.top-p.y,0,p.y-rect.bottom));if(start&&lastPointer&&lastPointer!==start&&performance.now()-lastPointer.time<100&&distance(lastPointer)<distance(start)){item.closeTimer=setTimeout(()=>{if(!item.box.matches(':hover'))closeFrom(stack.indexOf(item));},175);}else closeFrom(stack.indexOf(item));},175);}}
  function bind(box){for(const badge of box.querySelectorAll('[data-preview-id]')){badge.removeAttribute('title');const open=badge.onclick;badge.onclick=event=>{clear();open?.(event);};badge.onpointerenter=event=>{const target=DescriptionLinks.targets(getEntries()).find(e=>e.id===badge.dataset.previewId&&(e.referenceKind||'entry')===badge.dataset.previewKind);if(target)entry(target,badge,event);};badge.onpointerleave=leave;badge.onfocus=badge.onpointerenter;badge.onblur=leave;}}
  function show(source,event,build,identity){
   clearTimeout(pending);if(disposed||blocked())return;
   const parent=stack.findIndex(item=>item.box.contains(source));
   if(parent>=0&&!stack[parent].locked)return;
   const existing=identity&&stack.find(item=>item.identity===identity);
   if(existing){clearTimeout(existing.closeTimer);existing.box.classList.add('preview-revisited');setTimeout(()=>existing.box.classList.remove('preview-revisited'),700);return;}
   if(parent+1>=5)return;
   pending=setTimeout(()=>{pending=null;
    if(disposed||!source.isConnected||blocked())return;
    closeFrom(parent+1);const box=node('div','diagram-hover entry-preview');box.id=prefix+(++serial);box.setAttribute('role','tooltip');
    const controls=node('div','preview-controls'),status=node('span','preview-lock-status','Hover to lock'),close=node('button','square-button');close.type='button';close.setAttribute('aria-label','Close preview');close.append(glyph('close'));controls.append(status,close);box.append(controls);
    const progress=node('div','preview-progress');progress.setAttribute('aria-hidden','true');box.append(progress);build(box);root.append(box);bind(box);
    const item={box,source,identity,locked:false,closeTimer:null,lockTimer:null};stack.push(item);source.setAttribute('aria-describedby',box.id);source.classList.add('preview-source');close.onclick=()=>closeFrom(stack.indexOf(item));
    box.onpointerenter=()=>{clearTimeout(item.closeTimer);if(item.locked)return;box.classList.add('preview-locking');item.lockTimer=setTimeout(()=>{item.locked=true;box.classList.remove('preview-locking');box.classList.add('preview-locked');status.textContent='Locked';},600);};
    box.onpointerleave=event=>{if(box.contains(event.relatedTarget))return;clearTimeout(item.lockTimer);box.classList.remove('preview-locking');if(!item.locked)leave();};
    const rect=source.getBoundingClientRect(),parentBox=parent>=0?stack[parent].box.getBoundingClientRect():null;
    box.style.width=Math.min(350,innerWidth-24)+'px';box.style.maxHeight=Math.max(100,innerHeight-24)+'px';const size=box.getBoundingClientRect();let x=parentBox?parentBox.right+10:rect.right+10;
    if(x+size.width>innerWidth-12)x=parentBox?parentBox.left-size.width-10:rect.left-size.width-10;
    let y=Math.max(12,Math.min(innerHeight-size.height-12,rect.top));x=Math.max(12,x);{const placement=parentBox||rect,workspace=root.querySelector('.diagram-viewport')?.getBoundingClientRect(),minimumX=parentBox?12:Math.max(12,workspace?.left||12),blockers=parentBox?stack.slice(0,-1).map(item=>item.box):[...root.querySelectorAll('.diagram-node')];const clampX=v=>Math.max(minimumX,Math.min(innerWidth-size.width-12,v)),clampY=v=>Math.max(12,Math.min(innerHeight-size.height-12,v));let best={x,y,score:Infinity};for(const cx of [x,placement.left-size.width-10,minimumX,innerWidth-size.width-12,placement.left])for(const cy of [y,placement.top-size.height-10,placement.bottom+10,12]){const px=clampX(cx),py=clampY(cy);let overlap=0;for(const other of blockers){const r=other.getBoundingClientRect();overlap+=Math.max(0,Math.min(px+size.width,r.right)-Math.max(px,r.left))*Math.max(0,Math.min(py+size.height,r.bottom)-Math.max(py,r.top));}const score=overlap*100+Math.hypot(px-x,py-y);if(score<best.score)best={x:px,y:py,score};}x=best.x;y=best.y;}box.style.left=x+'px';box.style.top=y+'px';box.style.zIndex=String(90+stack.length);
   },180);
  }
  function entry(record,source,event){show(source,event,box=>{
   const badge=node('button','description-reference',record.title);badge.type='button';badge.setAttribute('role','link');badge.setAttribute('aria-label','Open '+record.title);CategoryColors.apply(badge,record);badge.onclick=()=>{clear();DescriptionLinks.openTarget(record,onRead);};box.append(badge);
   if(record.tags?.length){const tags=node('div','tags');for(const text of record.tags.slice(0,3))tags.append(node('span','tag',text));if(record.tags.length>3)tags.append(node('span','tag',`+${record.tags.length-3} more`));box.append(tags);}
   if(DescriptionLinks.plain(record,getEntries(),'summary').trim())box.append(DescriptionLinks.preview(node('p'),record,getEntries(),onRead,'summary',record.referenceKind==='ecosystem'?70:Infinity));
  },key(record));}
  function escape(event){if(root.isConnected&&event.key==='Escape'&&stack.length){event.preventDefault();event.stopImmediatePropagation();closeFrom(stack.length-1);}}
  document.addEventListener('keydown',escape,true);
  return {entry,show,leave,clear,dispose(){disposed=true;clear();root.removeEventListener('pointermove',track);document.removeEventListener('keydown',escape,true);}};
 }
 return {mount};
})();

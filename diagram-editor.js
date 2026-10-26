/* Reusable graph workspace. The host supplies domain wording, lore resolution and persistence. */
const DiagramEditor=(()=>{
 function mount(root,{graph,resolve,candidates,onRead,onError,readOnly=false,view=null,entryLabel='Entry',title='Relationships',defaultRelationship='connected to',suggestions=[],onFullscreen=null}){
  root.classList.add('diagram-canvas');
  let detailsOpen=view?.detailsOpen??!readOnly,listOpen=view?.listOpen??false;
  // Padding gives the camera room around the world origin without changing saved node coordinates.
  const origin=2000;
  const markerId='diagram-arrow-'+crypto.randomUUID();
  let value=structuredClone(graph),selected=null,focus=view?.focus||null,depth=view?.depth||1,zoom=view?.zoom||1;
  let undo=[],redo=[],readInspector=null,inspectorBaseline='',editRemembered=false,lastError='',drag=null,pan=null,layer,edgesLayer,suppressClick=false,collecting=false;
  const toolbar=node('div','diagram-toolbar'),tools=node('div','diagram-tools'),filters=node('div','diagram-filters');
  const body=node('div','diagram-body'),viewport=node('div','diagram-viewport'),plane=node('div','diagram-plane'),inspector=node('aside','diagram-inspector'),list=node('div','diagram-list');
  inspector.setAttribute('aria-label','Selection details');viewport.tabIndex=0;viewport.setAttribute('aria-label','Relationship diagram');viewport.append(plane);body.append(viewport,inspector);toolbar.append(tools,filters);root.append(toolbar,body,list);
  const button=(label,fn,icon)=>{const b=node('button',icon?'square-button':'secondary',icon?undefined:label);b.type='button';b.setAttribute('aria-label',label);b.title=label;if(icon)b.append(glyph(icon));b.onclick=fn;return b;};
  const report=message=>{lastError=message;onError(message);};
  const remember=()=>{undo.push(structuredClone(value));if(undo.length>100)undo.shift();redo=[];};
  const rawFields=()=>JSON.stringify([...inspector.querySelectorAll('input,textarea,select')].map(el=>[el.value,el.checked]));
  const label=n=>resolve(n)?.title||n.label+(n.kind==='entry'?' (unavailable)':'');
  function flush(force=false,showError=true){
   if(collecting)return true;
   if(!readInspector||(!force&&rawFields()===inspectorBaseline))return true;
   try{
    collecting=true;const next=readInspector();DiagramModel.validate(next);
    if(JSON.stringify(next)!==JSON.stringify(value)){if(!editRemembered){remember();editRemembered=true;}const added=next.edges.find(edge=>!value.edges.some(old=>old.id===edge.id));value=next;if(selected?.kind==='newEdge'&&added)selected={kind:'edge',id:added.id};draw();}
    inspectorBaseline=rawFields();report('');return true;
   }catch(error){if(showError)report(error.message);return false;}finally{collecting=false;}
  }
  function select(next){if(!flush())return;selected=next;if(!readOnly)detailsOpen=true;inspect();draw();}
  function change(fn){if(!flush())return;const count=value.nodes.length;remember();fn();if(selected)detailsOpen=true;inspect();draw();if(value.nodes.length>count&&selected?.kind==='node'){const n=value.nodes.find(n=>n.id===selected.id);viewport.scrollTo((n.x+105+origin)*zoom-viewport.clientWidth/2,(n.y+133+origin)*zoom-viewport.clientHeight/2);}report('');}
  function inspect(){
   readInspector=null;editRemembered=false;inspector.replaceChildren();inspector.hidden=!detailsOpen;body.classList.toggle('details-collapsed',!detailsOpen);
   if(readOnly){inspector.append(node('h3','',title),node('p','storage-note','Open an entry card to read it. Choose Edit canvas to arrange cards or change relationships.'));inspectorBaseline=rawFields();return;}
   if(!selected){inspector.append(node('h3','',title),node('p','storage-note','Select a card or connection to edit it. Drag cards to arrange them; drag blank space to pan. Changes are kept in this draft until you save.'));inspectorBaseline=rawFields();return;}
   if(selected.kind==='node'){
    const n=value.nodes.find(n=>n.id===selected.id);if(!n){selected=null;return inspect();}
    inspector.append(node('h3','',label(n)));const actions=node('div','diagram-selection-actions');
    if(n.kind==='text'){
     const input=Geography.inputField(inspector,'Card label',n.label,'input',120);
     readInspector=()=>{if(!input.value.trim())throw new Error('Enter a card label.');return {...value,nodes:value.nodes.map(item=>item.id===n.id?{...item,label:input.value.trim()}:item)};};
    }else if(resolve(n))actions.append(button('Read entry',()=>{if(!flush())return;selected={kind:'node',id:n.id};onRead(n.entryId);},'book'));
    actions.append(button('Connect from this card',()=>select({kind:'newEdge',source:n.id}),'link'),button('Show its connections',()=>{if(!flush())return;focus=n.id;focusPicker.value=n.id;draw();},'search'),button('Remove card',()=>{readInspector=null;change(()=>{value=DiagramModel.removeNode(value,n.id);selected=null;});},'trash'));
    inspector.append(actions,node('p','storage-note','Removing a card also removes its diagram connections. The entry and ecosystem membership are kept.'));
   }else{
    const existing=selected.kind==='edge'?value.edges.find(e=>e.id===selected.id):null;
    if(selected.kind==='edge'&&!existing){selected=null;return inspect();}
    const draft=existing||{id:crypto.randomUUID(),source:selected.source||value.nodes[0]?.id||'',target:value.nodes.find(n=>n.id!==(selected.source||value.nodes[0]?.id))?.id||'',label:defaultRelationship,notes:'',uncertain:false};
    const options=value.nodes.map(n=>({value:n.id,label:label(n)}));
    inspector.append(node('h3','',existing?'Edit connection':'New connection'));
    const mutual=existing&&DiagramModel.displayEdges(value).find(group=>group.mutual&&group.ids.includes(existing.id));if(mutual){const directions=node('div','diagram-directions');directions.append(node('small','','Direction to edit'));for(const id of mutual.ids){const edge=value.edges.find(e=>e.id===id),a=value.nodes.find(n=>n.id===edge.source),b=value.nodes.find(n=>n.id===edge.target),choice=button(label(a)+' → '+label(b),()=>select({kind:'edge',id}));choice.setAttribute('aria-label','Edit direction: '+label(a)+' → '+label(b));choice.setAttribute('aria-pressed',String(id===existing.id));directions.append(choice);}inspector.append(directions);}
    const source=Geography.selectField(inspector,'From',draft.source,options),target=Geography.selectField(inspector,'To',draft.target,options),wording=Geography.inputField(inspector,'Relationship',draft.label,'input',120);
    const datalist=node('datalist');datalist.id='diagram-wording-'+crypto.randomUUID();for(const text of new Set([...suggestions,...value.edges.map(e=>e.label)])){const option=node('option');option.value=text;datalist.append(option);}wording.setAttribute('list',datalist.id);inspector.append(datalist);
    const notes=Geography.inputField(inspector,'Connection notes',draft.notes,'textarea',6000);DescriptionLinks.bind(notes,draft,'notes',{label:'Connection notes'});
    const uncertain=node('input'),check=node('label','diagram-checkbox');uncertain.type='checkbox';uncertain.checked=draft.uncertain;check.append(uncertain,document.createTextNode(' Uncertain relationship'));inspector.append(check);
    readInspector=()=>{
     const base=value.edges.find(e=>e.id===draft.id)||draft,next=DescriptionLinks.collectFields({...base,source:source.value,target:target.value,label:wording.value.trim(),uncertain:uncertain.checked},{notes});
     return {...value,edges:value.edges.some(e=>e.id===draft.id)?value.edges.map(e=>e.id===draft.id?next:e):[...value.edges,next]};
    };
    const actions=node('div','diagram-selection-actions');actions.append(button('New connection',()=>{if(flush(true))select({kind:'newEdge'});},'plus'));
    actions.append(button(existing?'Remove connection':'Cancel connection',()=>{readInspector=null;change(()=>{value={...value,edges:value.edges.filter(e=>e.id!==draft.id)};selected=null;});},existing?'trash':'close'));
    inspector.append(actions,node('p','storage-note','Arrows read: From → relationship → To. Matching reverse relationships share a double-headed line; each direction keeps its own notes.'));
   }
   inspectorBaseline=rawFields();
  }
  // Collect valid field changes into the local graph without rebuilding focused controls.
  inspector.addEventListener('input',()=>flush(false,false));inspector.addEventListener('change',()=>flush(false,false));

  const editTools=node('div','diagram-edit-tools');tools.append(editTools);
  function nextPosition(){const columns=Math.max(4,Math.ceil(Math.sqrt(value.nodes.length+1)));for(let i=0;i<(value.nodes.length+1)*6;i++){const x=80+(i%columns)*300,y=80+Math.floor(i/columns)*320;const occupied=value.nodes.some(n=>{const h=210+Math.max(54,Math.ceil(label(n).length/22)*21+28);return x<n.x+226&&x+226>n.x&&y<n.y+h+16&&y+281>n.y;});if(!occupied)return {x,y};}return {x:80,y:80};}
  const addPanel=node('details','diagram-add-panel'),addSummary=node('summary','square-button');addSummary.append(glyph('plus'));addSummary.title='Add entry';addSummary.setAttribute('aria-label','Add entry');addPanel.append(addSummary);
  const addBody=node('div','diagram-add-body'),search=Geography.inputField(addBody,'Search entries','','input',120),category=Geography.selectField(addBody,'Entry category','',[]),choices=node('div','reference-options');search.type='search';addBody.append(choices);addPanel.append(addBody);
  function drawCandidates(){
   const selectedCategory=category.value,names=[...new Set(candidates().map(e=>e.category))].sort();category.replaceChildren(new Option('All categories',''),...names.map(name=>new Option(name,name)));category.value=names.includes(selectedCategory)?selectedCategory:'';
   choices.replaceChildren();const q=search.value.trim().toLowerCase(),all=candidates().filter(e=>!value.nodes.some(n=>n.kind==='entry'&&n.entryId===e.id)&&(!category.value||e.category===category.value)&&[e.title,e.category,...e.tags||[]].join(' ').toLowerCase().includes(q));
   for(const entry of all.slice(0,30)){const row=button(entry.title,()=>change(()=>{const n={id:crypto.randomUUID(),kind:'entry',entryId:entry.id,label:entry.title,...nextPosition()};value.nodes.push(n);selected={kind:'node',id:n.id};focus=null;addPanel.open=false;}));row.className='diagram-add-option';const name=node('span','',entry.title);CategoryColors.apply(name,entry);row.replaceChildren(name,node('small','',entry.category));choices.append(row);}
   if(!all.length)choices.append(node('p','storage-note','No matching entries available.'));if(all.length>30)choices.append(node('small','','Search to narrow these results.'));
  }
  search.oninput=category.onchange=drawCandidates;
  const undoButton=button('Undo',()=>{if(!flush()||!undo.length)return;redo.push(value);value=undo.pop();selected=null;inspect();draw();report('');},'undo');
  const redoButton=button('Redo',()=>{if(!flush()||!redo.length)return;undo.push(value);value=redo.pop();selected=null;inspect();draw();report('');},'redo');
  editTools.append(addPanel,button('Add text card',()=>change(()=>{const n={id:crypto.randomUUID(),kind:'text',label:'New text card',...nextPosition()};value.nodes.push(n);selected={kind:'node',id:n.id};focus=null;}),'text'),button('Connect cards',()=>{if(value.nodes.length<2)return report('Add at least two cards to connect them.');if(flush())select({kind:'newEdge'});},'link'),undoButton,redoButton,button('Arrange automatically',()=>{change(()=>{value=DiagramModel.arrange(value);focus=null;});fit();},'arrange'));
  const viewTools=node('div','diagram-view-tools');tools.append(viewTools);viewTools.append(button('Zoom in',()=>setZoom(zoom*1.25),'zoom'),button('Zoom out',()=>setZoom(zoom/1.25),'zoomout'),button('Fit canvas',fit,'fit'),button('Show all',()=>{focus=null;depth=1;find.value='';draw();},'grid'));if(onFullscreen)viewTools.append(button('Browser fullscreen',onFullscreen,'fullscreen'));const detailsButton=button('Selection details',()=>{if(!flush())return;detailsOpen=!detailsOpen;inspect();draw();},'panel'),listButton=button('Connections',()=>{listOpen=!listOpen;draw();},'list');viewTools.append(detailsButton,listButton);
  const find=Geography.inputField(filters,'Find a card','','input',120);find.type='search';find.placeholder='Search this diagram…';
  const focusPicker=Geography.selectField(filters,'Show connections for',focus||'',[]),depthPicker=Geography.selectField(filters,'Explore',String(depth),[{value:'1',label:'Direct connections'},{value:'500',label:'Connected chain'}]);
  focusPicker.onchange=()=>{focus=focusPicker.value||null;draw();};depthPicker.onchange=()=>{depth=Number(depthPicker.value);draw();};find.oninput=()=>draw();
  function shownIds(){const shown=DiagramModel.neighborhood(value,focus,depth),q=find.value.trim().toLowerCase();if(!q)return shown;return new Set(value.nodes.filter(n=>shown.has(n.id)&&label(n).toLowerCase().includes(q)).map(n=>n.id));}
  function updateChoices(){editTools.hidden=readOnly;detailsButton.setAttribute('aria-expanded',String(detailsOpen));listButton.setAttribute('aria-expanded',String(listOpen));inspector.hidden=!detailsOpen;body.classList.toggle('details-collapsed',!detailsOpen);list.hidden=!listOpen;root.classList.toggle('read-only-diagram',readOnly);const selectedFocus=focus;focusPicker.replaceChildren(new Option('All cards',''),...value.nodes.map(n=>new Option(label(n),n.id)));focusPicker.value=selectedFocus||'';depthPicker.value=String(depth);undoButton.disabled=!undo.length;redoButton.disabled=!redo.length;if(!readOnly)drawCandidates();}
  function setZoom(next){const x=(viewport.scrollLeft+viewport.clientWidth/2)/zoom,y=(viewport.scrollTop+viewport.clientHeight/2)/zoom;zoom=Math.max(.15,Math.min(2.5,next));draw();viewport.scrollTo(x*zoom-viewport.clientWidth/2,y*zoom-viewport.clientHeight/2);}
  function fit(){const shown=shownIds(),nodes=value.nodes.filter(n=>shown.has(n.id));if(!nodes.length)return;const left=Math.min(...nodes.map(n=>n.x))-40,top=Math.min(...nodes.map(n=>n.y))-40,right=Math.max(...nodes.map(n=>n.x+250)),bottom=Math.max(...nodes.map(n=>n.y+300));zoom=Math.max(.15,Math.min(2.5,viewport.clientWidth/(right-left),viewport.clientHeight/(bottom-top)));draw();viewport.scrollTo((left+origin)*zoom,(top+origin)*zoom);}
  function draw(){
   updateChoices();const activeId=document.activeElement?.dataset.nodeId;plane.replaceChildren();
   const width=Math.max(1200,...value.nodes.map(n=>n.x+280)),height=Math.max(700,...value.nodes.map(n=>n.y+330));plane.style.width=(width+2*origin)*zoom+'px';plane.style.height=(height+2*origin)*zoom+'px';
   layer=node('div','diagram-layer');layer.style.width=width+'px';layer.style.height=height+'px';layer.style.transform=`translate(${origin*zoom}px,${origin*zoom}px) scale(${zoom})`;plane.append(layer);edgesLayer=node('div','diagram-edge-layer');layer.append(edgesLayer);
   const shown=shownIds();for(const n of value.nodes){if(!shown.has(n.id))continue;
    const card=button(label(n),()=>{if(suppressClick){suppressClick=false;return;}if(readOnly){if(resolve(n)){selected={kind:'node',id:n.id};onRead(n.entryId);}}else select({kind:'node',id:n.id});});
    card.className='diagram-node';card.dataset.nodeId=n.id;card.setAttribute('aria-pressed',String(selected?.kind==='node'&&selected.id===n.id));card.style.left=n.x+'px';card.style.top=n.y+'px';
    const entry=resolve(n),image=node('div','diagram-node-image');if(entry?.image){const img=node('img');img.src=entry.image;img.alt='';image.append(img);}else image.append(glyph(entry?categoryIcon(entry.category):n.kind==='text'?'text':'book'));
    const name=node('span','diagram-node-title',label(n));if(entry)CategoryColors.apply(name,entry);card.replaceChildren(image,name);
    card.onpointerdown=event=>{if(readOnly||event.button!==0||!flush())return;drag={id:n.id,x:event.clientX,y:event.clientY,ox:n.x,oy:n.y,moved:false};card.setPointerCapture(event.pointerId);};
    card.onpointermove=event=>{if(!drag||drag.id!==n.id)return;const dx=(event.clientX-drag.x)/zoom,dy=(event.clientY-drag.y)/zoom;if(!drag.moved&&Math.hypot(dx,dy)>3){remember();drag.moved=true;}if(drag.moved){n.x=Math.max(0,Math.min(100000,drag.ox+dx));n.y=Math.max(0,Math.min(100000,drag.oy+dy));card.style.left=n.x+'px';card.style.top=n.y+'px';drawEdges();}};
    card.onpointerup=card.onpointercancel=()=>{if(drag?.moved){suppressClick=true;setTimeout(()=>suppressClick=false,0);drag=null;draw();report('');}else drag=null;};
    card.onkeydown=event=>{if(readOnly||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();change(()=>{n.x=Math.max(0,Math.min(100000,n.x+(event.key==='ArrowLeft'?-20:event.key==='ArrowRight'?20:0)));n.y=Math.max(0,Math.min(100000,n.y+(event.key==='ArrowUp'?-20:event.key==='ArrowDown'?20:0)));});};
    layer.append(card);
   }
   if(!shown.size)layer.append(node('p','diagram-empty','No cards match this view. Use Show all to reset the filters.'));
   drawEdges();if(activeId)[...layer.querySelectorAll('[data-node-id]')].find(el=>el.dataset.nodeId===activeId)?.focus({preventScroll:true});
  }
  function drawEdges(){
   edgesLayer.replaceChildren();const shown=shownIds(),sizes=new Map([...layer.querySelectorAll('[data-node-id]')].map(el=>[el.dataset.nodeId,{width:el.offsetWidth||210,height:el.offsetHeight||265}]));
   const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('diagram-lines');svg.setAttribute('width',layer.style.width);svg.setAttribute('height',layer.style.height);
   const defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');marker.id=markerId;for(const [key,v] of Object.entries({viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto-start-reverse'}))marker.setAttribute(key,v);const arrow=document.createElementNS(ns,'path');arrow.setAttribute('d','M 0 0 L 10 5 L 0 10 z');marker.append(arrow);defs.append(marker);svg.append(defs);edgesLayer.append(svg);
   for(const group of DiagramModel.displayEdges(value)){
    if(!shown.has(group.edge.source)||!shown.has(group.edge.target))continue;
    const geometry=DiagramModel.route(group,value.nodes,sizes),g=document.createElementNS(ns,'g'),line=document.createElementNS(ns,'path'),hit=document.createElementNS(ns,'path');g.dataset.edgeIds=JSON.stringify(group.ids);g.classList.toggle('selected',group.ids.includes(selected?.id));
    for(const path of [line,hit])path.setAttribute('d',geometry.path);line.classList.add('diagram-edge');hit.classList.add('diagram-edge-hit');line.setAttribute('marker-end',`url(#${markerId})`);if(group.mutual)line.setAttribute('marker-start',`url(#${markerId})`);if(group.edge.uncertain)line.setAttribute('stroke-dasharray','7 5');g.append(hit,line);g.onclick=()=>{if(!readOnly)select({kind:'edge',id:group.edge.id});};svg.append(g);
    const caption=button(group.edge.label,()=>{if(!readOnly)select({kind:'edge',id:group.edge.id});});caption.className='diagram-edge-label';caption.dataset.edgeIds=JSON.stringify(group.ids);caption.style.left=geometry.label.x+'px';caption.style.top=geometry.label.y+'px';caption.title=group.mutual?group.edge.label+' · both directions':group.edge.label;caption.setAttribute('aria-label',(group.mutual?'Mutual connection: ':'Edit connection: ')+group.edge.label);if(readOnly)caption.disabled=true;edgesLayer.append(caption);
   }
   list.replaceChildren();const heading=node('div','section-title');heading.append(node('h3','','Connections'),node('span','',String(value.edges.filter(e=>shown.has(e.source)&&shown.has(e.target)).length)));list.append(heading);
   for(const e of value.edges){if(!shown.has(e.source)||!shown.has(e.target))continue;const a=value.nodes.find(n=>n.id===e.source),b=value.nodes.find(n=>n.id===e.target),row=node('div','diagram-connection-item'),sentence=`${label(a)} → ${e.label} → ${label(b)}${e.uncertain?' · uncertain':''}`;
    const text=readOnly?node('p','diagram-connection-row',sentence):button(sentence,()=>select({kind:'edge',id:e.id}));text.classList.add('diagram-connection-row');text.dataset.edgeId=e.id;row.append(text);if(e.notes)row.append(DescriptionLinks.renderField(node('p','location-prose'),e,'notes',entries,onRead));list.append(row);
   }
   if(!value.edges.length)list.append(node('p','storage-note','No connections yet. Add cards, then connect them.'));else if(!value.edges.some(e=>shown.has(e.source)&&shown.has(e.target)))list.append(node('p','storage-note','No connections match this view.'));
  }
  viewport.addEventListener('wheel',event=>{event.preventDefault();const rect=viewport.getBoundingClientRect(),x=(viewport.scrollLeft+event.clientX-rect.left)/zoom,y=(viewport.scrollTop+event.clientY-rect.top)/zoom;zoom=Math.max(.15,Math.min(2.5,zoom*(event.deltaY<0?1.12:1/1.12)));draw();viewport.scrollTo(x*zoom-event.clientX+rect.left,y*zoom-event.clientY+rect.top);},{passive:false});
  viewport.onpointerdown=event=>{if(event.button!==0||event.target.closest('button,g'))return;pan={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);};viewport.onpointermove=event=>{if(pan)viewport.scrollTo(pan.left-(event.clientX-pan.x),pan.top-(event.clientY-pan.y));};viewport.onpointerup=viewport.onpointercancel=()=>pan=null;
  if(view?.selected)selected=view.selected;draw();inspect();requestAnimationFrame(()=>{if(root.isConnected)drawEdges();});if(view){find.value=view.search||'';draw();requestAnimationFrame(()=>viewport.scrollTo((view.left||0)+origin*zoom,(view.top||0)+origin*zoom));}else requestAnimationFrame(()=>viewport.scrollTo(origin*zoom,origin*zoom));
  return {
   get view(){return {zoom,left:viewport.scrollLeft-origin*zoom,top:viewport.scrollTop-origin*zoom,centerX:(viewport.scrollLeft+viewport.clientWidth/2)/zoom-origin,centerY:(viewport.scrollTop+viewport.clientHeight/2)/zoom-origin,focus,depth,search:find.value,detailsOpen,listOpen,selected};},
   get snapshot(){return JSON.stringify([value,rawFields()!==inspectorBaseline?rawFields():'',selected?.kind==='newEdge'?'new connection':'']);},
   get value(){return structuredClone(value);},
   collect(){if(!flush(true))throw new Error(lastError);return structuredClone(value);},
   restoreView(view={}){zoom=view.zoom||1;focus=view.focus||null;depth=view.depth||1;detailsOpen=view.detailsOpen??!readOnly;listOpen=view.listOpen??false;selected=view.selected||null;find.value=view.search||'';inspect();draw();requestAnimationFrame(()=>viewport.scrollTo((view.left||0)+origin*zoom,(view.top||0)+origin*zoom));},reframe(view){if(!view)return;viewport.scrollTo((view.centerX+origin)*zoom-viewport.clientWidth/2,(view.centerY+origin)*zoom-viewport.clientHeight/2);},focusEntry(id){if(!flush())return;const n=value.nodes.find(n=>n.kind==='entry'&&n.entryId===id);if(!n)return;focus=n.id;selected={kind:'node',id:n.id};find.value='';inspect();draw();fit();},refresh(){draw();},setReadOnly(next){readOnly=next;inspect();draw();},loadGraph(graph){value=structuredClone(graph);undo=[];redo=[];inspect();draw();},setBusy(busy){root.inert=busy;},dispose(){inspector.replaceChildren();},fit
  };
 }
 return {mount};
})();

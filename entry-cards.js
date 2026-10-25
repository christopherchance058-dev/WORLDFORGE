/* Shared entry thumbnails and a browser-only size preference; originals stay untouched. */
const EntryCards=(()=>{
 const sizes=['small','medium','large'],key='worldforge.entry-card-size';let size='medium';
 try{const saved=localStorage.getItem(key),legacy=localStorage.getItem('worldforge.character-card-size');size=sizes.includes(saved)?saved:legacy==='compact'?'small':sizes.includes(legacy)?legacy:'medium';}catch{}
 function sync(){document.querySelectorAll('.entry-card').forEach(card=>card._updatePreview?.());document.querySelectorAll('.entry-grid').forEach(grid=>grid.dataset.size=size);document.querySelectorAll('.entry-size-control').forEach(label=>{label.querySelector('input').value=String(sizes.indexOf(size));label.querySelector('input').setAttribute('aria-valuetext',size[0].toUpperCase()+size.slice(1));label.querySelector('.entry-size-value').textContent=size[0].toUpperCase()+size.slice(1);});}
 function control(label='Card size'){const wrap=node('label','entry-size-control','Card size'),input=node('input'),output=node('span','entry-size-value');input.type='range';input.min='0';input.max='2';input.step='1';input.setAttribute('aria-label',label);wrap.append(input,output);input.value=String(sizes.indexOf(size));input.setAttribute('aria-valuetext',size[0].toUpperCase()+size.slice(1));output.textContent=size[0].toUpperCase()+size.slice(1);input.oninput=()=>{size=sizes[Number(input.value)]||'medium';try{localStorage.setItem(key,size);}catch{}sync();};return wrap;}
 function grid(element){element.classList.add('entry-grid');element.dataset.size=size;return element;}
 function card(e,{onOpen,label=`Open ${e.title}`,className='',heading='h3',metadata,icon}={}){
  const button=node('article',`entry-card ${categoryClass(e.category)} ${className}`);const open=node('button','entry-card-open');open.type='button';open.setAttribute('aria-label',label);open.title=e.title;open.onclick=onOpen;button.onclick=event=>{if(!event.target.closest('button,a'))onOpen?.();};
  const media=node('div','entry-card-media'),thumbnail=node('div','entry-card-thumbnail');
  if(e.image){const image=node('img');image.src=e.image;image.alt='';image.loading='lazy';thumbnail.append(image);}else{thumbnail.classList.add('entry-card-placeholder');thumbnail.append(glyph(icon||categoryIcon(e.category)));}media.append(thumbnail);
  const copy=node('div','entry-card-copy'),title=node(heading,'entry-card-title',e.title);title.textContent='';open.textContent=e.title;title.append(open);copy.append(title);
  const facts=metadata===undefined?[e.category,e.category==='History'&&e.year!==''?`Year ${e.year}`:''].filter(Boolean).join(' · '):metadata;
  if(typeof facts==='string'&&facts.trim())copy.append(node('p','entry-card-facts',facts.trim()));
  const body=node('div','entry-card-content');const field=DescriptionLinks.plain(e,entries,'summary').trim()?'summary':'description';if(DescriptionLinks.plain(e,entries,field).trim()){const preview=node('div','entry-card-summary');button._updatePreview=()=>DescriptionLinks.preview(preview,e,entries,showDetail,field,({small:18,medium:40,large:70})[size]);button._updatePreview();body.append(preview);}if(e.tags?.length){const tags=node('div','entry-card-tags');for(const tag of e.tags.slice(0,3))tags.append(node('span','tag',tag));if(e.tags.length>3){const more=node('span','tag',`+${e.tags.length-3} more`);more.title=e.tags.slice(3).join(', ');tags.append(more);}copy.append(tags);}
  button.append(media,copy);if(body.childNodes.length)button.append(body);return button;
 }
 function fullImage(image,title){const link=node('a','full-image-link','View full image ↗');link.href=image;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`View full image of ${title}`);return link;}
 return {card,grid,control,fullImage};
})();

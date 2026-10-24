/* Shared entry thumbnails and a browser-only size preference; originals stay untouched. */
const EntryCards=(()=>{
 const sizes=['small','medium','large'],key='worldforge.entry-card-size';let size='medium';
 try{const saved=localStorage.getItem(key),legacy=localStorage.getItem('worldforge.character-card-size');size=sizes.includes(saved)?saved:legacy==='compact'?'small':sizes.includes(legacy)?legacy:'medium';}catch{}
 function sync(){document.querySelectorAll('.entry-grid').forEach(grid=>grid.dataset.size=size);document.querySelectorAll('.entry-size-control').forEach(label=>{label.querySelector('input').value=String(sizes.indexOf(size));label.querySelector('input').setAttribute('aria-valuetext',size[0].toUpperCase()+size.slice(1));label.querySelector('.entry-size-value').textContent=size[0].toUpperCase()+size.slice(1);});}
 function control(label='Card size'){const wrap=node('label','entry-size-control','Card size'),input=node('input'),output=node('span','entry-size-value');input.type='range';input.min='0';input.max='2';input.step='1';input.setAttribute('aria-label',label);wrap.append(input,output);input.value=String(sizes.indexOf(size));input.setAttribute('aria-valuetext',size[0].toUpperCase()+size.slice(1));output.textContent=size[0].toUpperCase()+size.slice(1);input.oninput=()=>{size=sizes[Number(input.value)]||'medium';try{localStorage.setItem(key,size);}catch{}sync();};return wrap;}
 function grid(element){element.classList.add('entry-grid');element.dataset.size=size;return element;}
 function card(e,{onOpen,label=`Open ${e.title}`,className='',heading='h3',metadata,icon}={}){
  const button=node('button',`entry-card ${categoryClass(e.category)} ${className}`);button.type='button';button.setAttribute('aria-label',label);button.title=e.title;button.onclick=onOpen;
  const media=node('div','entry-card-media'),thumbnail=node('div','entry-card-thumbnail');
  if(e.image){const image=node('img');image.src=e.image;image.alt='';image.loading='lazy';thumbnail.append(image);}else{thumbnail.classList.add('entry-card-placeholder');thumbnail.append(glyph(icon||categoryIcon(e.category)));}media.append(thumbnail);
  const copy=node('div','entry-card-copy'),title=node(heading,'entry-card-title',e.title);copy.append(title);
  const facts=metadata===undefined?[e.category,e.category==='History'&&e.year!==''?`Year ${e.year}`:''].filter(Boolean).join(' · '):metadata;
  if(typeof facts==='string'&&facts.trim())copy.append(node('p','entry-card-facts',facts.trim()));
  const summary=DescriptionLinks.plain(e,entries,'summary').trim()||DescriptionLinks.plain(e,entries).trim();if(summary)copy.append(node('p','entry-card-summary',summary));
  button.append(media,copy);return button;
 }
 function fullImage(image,title){const link=node('a','full-image-link','View full image ↗');link.href=image;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`View full image of ${title}`);return link;}
 return {card,grid,control,fullImage};
})();

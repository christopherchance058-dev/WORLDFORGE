/* Shared category color policy. Only record reference badges receive these colors. */
(function(root){
 const palette={Eras:'#58b8ad',Canvas:'#7fb99a',Ecosystem:'#7fb99a',Characters:'#b69bd6',Locations:'#72b5cc',History:'#d5b05f',Factions:'#c594b6',Magic:'#969ee0',Bestiary:'#c89b68',Creatures:'#c89b68'};
 // Keep the original fallback palette stable for existing custom categories.
 const defaultSwatches=['#b69bd6','#72b5cc','#d5b05f','#c594b6','#969ee0','#c89b68','#7fb99a','#cf8d85'];
 const swatches=[...defaultSwatches,'#e57373','#c62828','#f48fb1','#ad1457','#ce93d8','#7b1fa2','#9575cd','#512da8','#7986cb','#283593','#64b5f6','#1565c0','#4dd0e1','#00838f','#4db6ac','#00695c','#81c784','#2e7d32','#c0ca33','#f9a825','#ffb74d','#ef6c00','#a1887f','#78909c'];
 const valid=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 function fallback(name){if(palette[name])return palette[name];let hash=0;for(const c of name||'')hash=(Math.imul(hash,31)+c.codePointAt(0))>>>0;return defaultSwatches[hash%defaultSwatches.length];}
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const luminance=hex=>rgb(hex).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function readable(color,dark=false){const backgrounds=dark?['#1d272b','#31463c']:['#ffffff','#edf2ec'],base=rgb(color),edge=dark?255:0;for(let step=0;step<=100;step++){const hex='#'+base.map(n=>Math.round(n+(edge-n)*step/100).toString(16).padStart(2,'0')).join('');if(backgrounds.every(bg=>contrast(hex,bg)>=(dark?4.5:5.5)))return hex;}return dark?'#ffffff':'#000000';}
 function resolve(name,definitions=[]){const color=definitions.find(c=>c.name===name)?.color;return valid(color)?color:fallback(name);}
 function style(element,category,definitions=[]){const color=resolve(category,definitions);element.classList.add('category-entry-link');element.dataset.linkCategory=category;element.style.setProperty('--entry-link-light',readable(color));element.style.setProperty('--entry-link-dark',readable(color,true));return element;}
 function apply(element,entry){if(entry.id){element.dataset.previewId=entry.id;element.dataset.previewKind=entry.referenceKind||'entry';}const era=entry.referenceKind==='era';style(element,era?'Eras':entry.category,era||typeof categoryDefinitions==='undefined'?[]:categoryDefinitions);if(era)element.dataset.referenceKind='era';if(!element.querySelector('.entry-reference-icon')){const icon=document.createElement('span');icon.className='glyph entry-reference-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=Symbols.svg(era?'clock':entry.referenceKind==='ecosystem'?'canvas':typeof categoryIcon==='function'?categoryIcon(entry.category):'book');const previous=element.querySelector(':scope>.glyph');if(previous)previous.remove();element.prepend(icon);}return element;}
 const api={valid,fallback,resolve,readable,contrast,style,apply,swatches};if(typeof module!=='undefined')module.exports=api;else root.CategoryColors=api;
})(globalThis);

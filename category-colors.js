/* Shared category color policy. Only clickable entry references receive these colors. */
(function(root){
 const palette={Characters:'#b69bd6',Locations:'#72b5cc',History:'#d5b05f',Factions:'#c594b6',Magic:'#969ee0',Bestiary:'#c89b68'};
 const swatches=['#b69bd6','#72b5cc','#d5b05f','#c594b6','#969ee0','#c89b68','#7fb99a','#cf8d85'];
 const valid=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 function fallback(name){if(palette[name])return palette[name];let hash=0;for(const c of name||'')hash=(Math.imul(hash,31)+c.codePointAt(0))>>>0;return swatches[hash%swatches.length];}
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const luminance=hex=>rgb(hex).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function readable(color,dark=false){const backgrounds=dark?['#1d272b','#31463c']:['#ffffff','#edf2ec'],base=rgb(color),edge=dark?255:0;for(let step=0;step<=100;step++){const hex='#'+base.map(n=>Math.round(n+(edge-n)*step/100).toString(16).padStart(2,'0')).join('');if(backgrounds.every(bg=>contrast(hex,bg)>=4.5))return hex;}return dark?'#ffffff':'#000000';}
 function resolve(name,definitions=[]){const color=definitions.find(c=>c.name===name)?.color;return valid(color)?color:fallback(name);}
 function style(element,category,definitions=[]){const color=resolve(category,definitions);element.classList.add('category-entry-link');element.dataset.linkCategory=category;element.style.setProperty('--entry-link-light',readable(color));element.style.setProperty('--entry-link-dark',readable(color,true));return element;}
 function apply(element,entry){return style(element,entry.category,typeof categoryDefinitions==='undefined'?[]:categoryDefinitions);}
 const api={valid,fallback,resolve,readable,contrast,style,apply,swatches};if(typeof module!=='undefined')module.exports=api;else root.CategoryColors=api;
})(globalThis);

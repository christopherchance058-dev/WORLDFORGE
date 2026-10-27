/* Reusable directed graphs. Domain meaning belongs to the workspace, not the canvas. */
(function(root){
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v),text=(v,n)=>typeof v==='string'&&v.length<=n,id=v=>text(v,120)&&!!v.trim();
 const Links=typeof module!=='undefined'?require('./description-links'):root.DescriptionLinks;
 const MAX_COORDINATE=100000;
 const colors=['default','green','blue','purple','amber','red'];
 const ink=e=>({green:'#43856a',blue:'#508fc4',purple:'#a17ac2',amber:'#b88a35',red:'#ca6868'}[e.color]||'var(--muted)');
 const weight=e=>({1:2,2:4,3:6}[e.weight||1]);
 const direction=edge=>edge.direction||'forward';
 const sides=['auto','top','right','bottom','left'],styles=['automatic','straight','elbow','curve'];
 const point=p=>object(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=MAX_COORDINATE&&Math.abs(p.y)<=MAX_COORDINATE;
 const empty=()=>({nodes:[],edges:[]});
 function validate(graph){
  if(!object(graph)||!Array.isArray(graph.nodes)||graph.nodes.length>500||!Array.isArray(graph.edges)||graph.edges.length>2000)throw new Error('Use up to 500 diagram cards and 2000 connections.');
  if(graph.snapToGrid!==undefined&&typeof graph.snapToGrid!=='boolean')throw new Error('Invalid grid snapping setting.');
  const ids=new Set(),targets=new Set();for(const n of graph.nodes){if(!object(n)||!id(n.id)||ids.has(n.id)||!['entry','text'].includes(n.kind)||!text(n.label,120)||!n.label.trim()||!Number.isFinite(n.x)||!Number.isFinite(n.y)||Math.abs(n.x)>MAX_COORDINATE||Math.abs(n.y)>MAX_COORDINATE||(n.kind==='entry'&&(!id(n.entryId)||targets.has(n.entryId))))throw new Error('Diagram cards need unique IDs, labels and valid positions.');if(n.locked!==undefined&&typeof n.locked!=='boolean')throw new Error('Invalid card position lock.');ids.add(n.id);if(n.kind==='entry')targets.add(n.entryId);}
  const edgeIds=new Set();for(const e of graph.edges){if(!object(e)||!id(e.id)||edgeIds.has(e.id)||!ids.has(e.source)||!ids.has(e.target)||e.source===e.target||!text(e.label,120)||(e.direction===undefined?!e.label.trim():!['none','forward','both'].includes(e.direction))||!text(e.notes,6000)||typeof e.uncertain!=='boolean')throw new Error('Connections need unique IDs, two different cards, a valid direction and valid notes.');if(e.weight!==undefined&&![1,2,3].includes(e.weight)||e.color!==undefined&&!colors.includes(e.color))throw new Error('Choose a valid line thickness and color.');if(e.routing!==undefined){const r=e.routing;if(!object(r)||(r.style!==undefined&&!styles.includes(r.style))||['sourceSide','targetSide'].some(k=>r[k]!==undefined&&!sides.includes(r[k]))||(r.bend!==undefined&&(r.style!=='elbow'||!point(r.bend)))||(r.controls!==undefined&&(r.style!=='curve'||!Array.isArray(r.controls)||r.controls.length!==2||!r.controls.every(point))))throw new Error('Invalid connection route.');}if(e.labelPosition!==undefined&&(!Number.isFinite(e.labelPosition)||e.labelPosition<0||e.labelPosition>1))throw new Error('Keep the label on its connection.');edgeIds.add(e.id);Links.validate(e);}
 }
 function arrange(graph,sizes=new Map()){const size=n=>sizes.get(n.id)||{width:210,height:265},stepX=Math.max(300,...graph.nodes.map(n=>size(n).width+40)),stepY=Math.max(320,...graph.nodes.map(n=>size(n).height+40));const columns=Math.max(1,Math.ceil(Math.sqrt(graph.nodes.length))),occupied=graph.nodes.filter(n=>n.locked);let slot=0;return {...graph,nodes:graph.nodes.map(n=>{if(n.locked)return n;let x,y;do{x=60+(slot%columns)*stepX;y=60+Math.floor(slot/columns)*stepY;slot++;}while(occupied.some(p=>x<p.x+size(p).width+16&&x+size(n).width+16>p.x&&y<p.y+size(p).height+16&&y+size(n).height+16>p.y));return {...n,x,y};})};}
 function layout(graph,selected,operation,sizes=new Map()){if(!['left','center','right','top','middle','bottom','distribute-horizontal','distribute-vertical'].includes(operation))throw new Error('Choose a layout action.');const nodes=graph.nodes.filter(n=>selected.includes(n.id));if(nodes.length<2)throw new Error('Select at least two cards.');if(nodes.some(n=>n.locked))throw new Error('Unlock selected cards before aligning or distributing.');const size=n=>sizes.get(n.id)||{width:210,height:265},changes=new Map(),left=Math.min(...nodes.map(n=>n.x)),right=Math.max(...nodes.map(n=>n.x+size(n).width)),top=Math.min(...nodes.map(n=>n.y)),bottom=Math.max(...nodes.map(n=>n.y+size(n).height));
  if(operation.startsWith('distribute')){if(nodes.length<3)throw new Error('Select at least three cards to distribute.');const horizontal=operation==='distribute-horizontal',axis=horizontal?'x':'y',dimension=horizontal?'width':'height',ordered=[...nodes].sort((a,b)=>a[axis]-b[axis]),first=ordered[0],last=ordered.at(-1),gap=(last[axis]+size(last)[dimension]-first[axis]-ordered.reduce((sum,n)=>sum+size(n)[dimension],0))/(ordered.length-1);let position=first[axis];for(const n of ordered){changes.set(n.id,{...n,[axis]:position});position+=size(n)[dimension]+gap;}}
  else for(const n of nodes){let x=n.x,y=n.y;switch(operation){case 'left':x=left;break;case 'center':x=(left+right-size(n).width)/2;break;case 'right':x=right-size(n).width;break;case 'top':y=top;break;case 'middle':y=(top+bottom-size(n).height)/2;break;case 'bottom':y=bottom-size(n).height;break;default:throw new Error('Choose a layout action.');}changes.set(n.id,{...n,x,y});}const next={...graph,nodes:graph.nodes.map(n=>changes.get(n.id)||n)};validate(next);return next;}
 function matchingRoutes(a,b){const x=a.routing||{},y=b.routing||{};return !x.controls&&!y.controls&&!x.bend&&!y.bend&&(x.style||'automatic')===(y.style||'automatic')&&(x.sourceSide||'auto')===(y.targetSide||'auto')&&(x.targetSide||'auto')===(y.sourceSide||'auto')&&Math.abs((a.labelPosition??.5)-(1-(b.labelPosition??.5)))<1e-9;}
 function removeNode(graph,id){return {...graph,nodes:graph.nodes.filter(n=>n.id!==id),edges:graph.edges.filter(e=>e.source!==id&&e.target!==id)};}
 // Combine only matching reverse records for display. The stored edges remain untouched.
 function displayEdges(graph){
  const pairs=new Map();
  for(const edge of graph.edges){const key=JSON.stringify([edge.source,edge.target].sort());if(!pairs.has(key))pairs.set(key,[]);pairs.get(key).push(edge);}
  const result=[];
  for(const edges of pairs.values()){
   const used=new Set(),groups=[];
   for(const edge of [...edges].sort((a,b)=>a.id.localeCompare(b.id))){
    if(used.has(edge.id))continue;used.add(edge.id);
    const reverse=direction(edge)==='forward'&&!!edge.label.trim()&&edges.find(other=>direction(other)==='forward'&&!used.has(other.id)&&other.source===edge.target&&matchingRoutes(edge,other)&&other.target===edge.source&&other.label.trim()===edge.label.trim()&&other.uncertain===edge.uncertain&&(other.weight||1)===(edge.weight||1)&&(other.color||'default')===(edge.color||'default'));
    if(reverse)used.add(reverse.id);
    groups.push({edge,ids:reverse?[edge.id,reverse.id]:[edge.id],mutual:!!reverse||direction(edge)==='both'});
   }
   groups.forEach((group,index)=>result.push({...group,lane:(index-(groups.length-1)/2)*48}));
  }
  return result;
 }
 // Neutral connections are explicit user actions, not inferred relationship facts.
 function connect(graph,sources,target,makeId){
  const ids=new Set(graph.nodes.map(n=>n.id));if(!ids.has(target)||sources.some(id=>!ids.has(id)))throw new Error('Choose cards that are still in this canvas.');
  if(sources.includes(target))throw new Error('Choose a target outside the selected source cards.');
  const edges=[];for(const source of new Set(sources)){
   if(graph.edges.some(e=>direction(e)==='none'&&!e.label.trim()&&((e.source===source&&e.target===target)||(e.source===target&&e.target===source))))continue;
   edges.push({id:makeId(),source,target,label:'',direction:'none',notes:'',uncertain:false});
  }
  const next={...graph,edges:[...graph.edges,...edges]};validate(next);return {graph:next,added:edges};
 }
 function routeLegacy(group,nodes,sizes=new Map()){
  const a=nodes.find(n=>n.id===group.edge.source),b=nodes.find(n=>n.id===group.edge.target);
  const size=n=>sizes.get(n.id)||{width:210,height:265},sa=size(a),sb=size(b),ac={x:a.x+sa.width/2,y:a.y+sa.height/2},bc={x:b.x+sb.width/2,y:b.y+sb.height/2};
  // A canonical normal prevents opposite directions from accidentally sharing a curve.
  const sign=a.id.localeCompare(b.id)<=0?1:-1,dx=(bc.x-ac.x)*sign,dy=(bc.y-ac.y)*sign,length=Math.hypot(dx,dy),normal=length?{x:-dy/length,y:dx/length}:{x:0,y:1};
  const control={x:(ac.x+bc.x)/2+(length?0:240)+normal.x*group.lane*2,y:(ac.y+bc.y)/2+normal.y*group.lane*2};
  function boundary(center,target,dimensions){let x=target.x-center.x,y=target.y-center.y;if(!x&&!y)x=1;const scale=1/Math.max(Math.abs(x)/(dimensions.width/2+4),Math.abs(y)/(dimensions.height/2+4));return {x:center.x+x*scale,y:center.y+y*scale};}
  const start=boundary(ac,control,sa),end=boundary(bc,control,sb);
  const pointAt=t=>({x:(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y});return {path:`M${start.x} ${start.y} Q${control.x} ${control.y} ${end.x} ${end.y}`,pointAt,handles:[]};
 }
 function route(group,nodes,sizes=new Map()){const edge=group.edge,r=edge.routing||{};let geometry;
  if((!r.style||r.style==='automatic')&&(!r.sourceSide||r.sourceSide==='auto')&&(!r.targetSide||r.targetSide==='auto'))geometry=routeLegacy(group,nodes,sizes);
  else{const a=nodes.find(n=>n.id===edge.source),b=nodes.find(n=>n.id===edge.target),sa=sizes.get(a.id)||{width:210,height:265},sb=sizes.get(b.id)||{width:210,height:265},ac={x:a.x+sa.width/2,y:a.y+sa.height/2},bc={x:b.x+sb.width/2,y:b.y+sb.height/2},dx=bc.x-ac.x,dy=bc.y-ac.y,vertical=Math.abs(dy)>Math.abs(dx),sourceSide=r.sourceSide&&r.sourceSide!=='auto'?r.sourceSide:vertical?(dy>=0?'bottom':'top'):(dx>=0?'right':'left'),targetSide=r.targetSide&&r.targetSide!=='auto'?r.targetSide:vertical?(dy>=0?'top':'bottom'):(dx>=0?'left':'right'),unit={top:{x:0,y:-1},right:{x:1,y:0},bottom:{x:0,y:1},left:{x:-1,y:0}};
   const anchor=(c,size,side)=>({x:c.x+unit[side].x*(size.width/2+4),y:c.y+unit[side].y*(size.height/2+4)}),start=anchor(ac,sa,sourceSide),end=anchor(bc,sb,targetSide),u=unit[sourceSide],v=unit[targetSide];if(r.style==='straight'&&group.lane){for(const [p,side,size] of [[start,sourceSide,sa],[end,targetSide,sb]]){if(side==='top'||side==='bottom')p.x+=Math.max(-size.width/2+12,Math.min(size.width/2-12,group.lane));else p.y+=Math.max(-size.height/2+12,Math.min(size.height/2-12,group.lane));}}let pointAt,path,handles=[];
   if(r.style==='straight'){pointAt=t=>({x:start.x+(end.x-start.x)*t,y:start.y+(end.y-start.y)*t});path=`M${start.x} ${start.y} L${end.x} ${end.y}`;}
   else if(r.style==='elbow'){const p={x:start.x+u.x*32,y:start.y+u.y*32},q={x:end.x+v.x*32,y:end.y+v.y*32},anchor={x:(p.x+q.x)/2,y:(p.y+q.y)/2},m={x:anchor.x+(r.bend?.x||0)+(!r.bend&&u.x?group.lane:0),y:anchor.y+(r.bend?.y||0)+(!r.bend&&u.y?group.lane:0)};const points=[start,p,...(u.x&&v.x?[{x:m.x,y:p.y},{x:m.x,y:q.y}]:u.y&&v.y?[{x:p.x,y:m.y},{x:q.x,y:m.y}]:[{x:p.x,y:m.y},{x:m.x,y:m.y},{x:m.x,y:q.y}]),q,end];path=points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ');const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);pointAt=t=>{let distance=t*total;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const ratio=lengths[i]?distance/lengths[i]:0;return {x:points[i].x+(points[i+1].x-points[i].x)*ratio,y:points[i].y+(points[i+1].y-points[i].y)*ratio};}distance-=lengths[i];}return start;};handles=[{key:'bend',axis:u.x&&v.x?'x':u.y&&v.y?'y':'both',x:u.y&&v.y?p.x:m.x,y:u.x&&v.x?p.y:m.y,anchor:{x:u.y&&v.y?p.x:anchor.x,y:u.x&&v.x?p.y:anchor.y}}];}
   else{const norm=Math.hypot(dx,dy)||1,canonical=a.id.localeCompare(b.id)<=0?1:-1,nx=-dy/norm*canonical,ny=dx/norm*canonical,reach=Math.max(70,Math.hypot(end.x-start.x,end.y-start.y)/3),bow=r.style==='curve'&&!group.lane?60:0,c1=r.controls?{x:start.x+r.controls[0].x,y:start.y+r.controls[0].y}:{x:start.x+u.x*reach+nx*(group.lane*2+bow),y:start.y+u.y*reach+ny*(group.lane*2+bow)},c2=r.controls?{x:end.x+r.controls[1].x,y:end.y+r.controls[1].y}:{x:end.x+v.x*reach+nx*(group.lane*2+bow),y:end.y+v.y*reach+ny*(group.lane*2+bow)};path=`M${start.x} ${start.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;pointAt=t=>({x:(1-t)**3*start.x+3*(1-t)**2*t*c1.x+3*(1-t)*t*t*c2.x+t**3*end.x,y:(1-t)**3*start.y+3*(1-t)**2*t*c1.y+3*(1-t)*t*t*c2.y+t**3*end.y});if(r.style==='curve')handles=[{key:'control-0',...c1,anchor:start},{key:'control-1',...c2,anchor:end}];}geometry={path,pointAt,handles};
  }return {...geometry,label:geometry.pointAt(edge.labelPosition??.5)};
 }
 function closestPosition(geometry,point){let best=0,distance=Infinity;const measure=t=>{const p=geometry.pointAt(t),d=Math.hypot(p.x-point.x,p.y-point.y);if(d<distance){distance=d;best=t;}};for(let i=0;i<=64;i++)measure(i/64);let step=1/64;for(let i=0;i<10;i++){measure(Math.max(0,best-step));measure(Math.min(1,best+step));step/=2;}return best;}
 function neighborhood(graph,focus,depth=1){
  if(!focus)return new Set(graph.nodes.map(n=>n.id));const seen=new Set([focus]);let frontier=[focus];
  for(let step=0;frontier.length&&step<depth;step++){const next=new Set();for(const edge of graph.edges){if(frontier.includes(edge.source)&&!seen.has(edge.target))next.add(edge.target);if(frontier.includes(edge.target)&&!seen.has(edge.source))next.add(edge.source);}frontier=[...next];frontier.forEach(id=>seen.add(id));}return seen;
 }
 const api={styles,sides,layout,closestPosition,colors,ink,weight,MAX_COORDINATE,direction,connect,empty,validate,arrange,removeNode,displayEdges,route,neighborhood};if(typeof module!=='undefined')module.exports=api;else root.DiagramModel=api;
})(globalThis);

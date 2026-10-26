/* Reusable directed graphs. Domain meaning belongs to the workspace, not the canvas. */
(function(root){
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v),text=(v,n)=>typeof v==='string'&&v.length<=n,id=v=>text(v,120)&&!!v.trim();
 const Links=typeof module!=='undefined'?require('./description-links'):root.DescriptionLinks;
 const MAX_COORDINATE=100000;
 const colors=['default','green','blue','purple','amber','red'];
 const ink=e=>({green:'#43856a',blue:'#508fc4',purple:'#a17ac2',amber:'#b88a35',red:'#ca6868'}[e.color]||'var(--muted)');
 const weight=e=>({1:2,2:4,3:6}[e.weight||1]);
 const direction=edge=>edge.direction||'forward';
 const empty=()=>({nodes:[],edges:[]});
 function validate(graph){
  if(!object(graph)||!Array.isArray(graph.nodes)||graph.nodes.length>500||!Array.isArray(graph.edges)||graph.edges.length>2000)throw new Error('Use up to 500 diagram cards and 2000 connections.');
  const ids=new Set(),targets=new Set();for(const n of graph.nodes){if(!object(n)||!id(n.id)||ids.has(n.id)||!['entry','text'].includes(n.kind)||!text(n.label,120)||!n.label.trim()||!Number.isFinite(n.x)||!Number.isFinite(n.y)||Math.abs(n.x)>MAX_COORDINATE||Math.abs(n.y)>MAX_COORDINATE||(n.kind==='entry'&&(!id(n.entryId)||targets.has(n.entryId))))throw new Error('Diagram cards need unique IDs, labels and valid positions.');ids.add(n.id);if(n.kind==='entry')targets.add(n.entryId);}
  const edgeIds=new Set();for(const e of graph.edges){if(!object(e)||!id(e.id)||edgeIds.has(e.id)||!ids.has(e.source)||!ids.has(e.target)||e.source===e.target||!text(e.label,120)||(e.direction===undefined?!e.label.trim():!['none','forward','both'].includes(e.direction))||!text(e.notes,6000)||typeof e.uncertain!=='boolean')throw new Error('Connections need unique IDs, two different cards, a valid direction and valid notes.');if(e.weight!==undefined&&![1,2,3].includes(e.weight)||e.color!==undefined&&!colors.includes(e.color))throw new Error('Choose a valid line thickness and color.');edgeIds.add(e.id);Links.validate(e);}
 }
 function arrange(graph){const columns=Math.max(1,Math.ceil(Math.sqrt(graph.nodes.length)));return {...graph,nodes:graph.nodes.map((n,i)=>({...n,x:60+(i%columns)*300,y:60+Math.floor(i/columns)*320}))};}
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
    const reverse=direction(edge)==='forward'&&!!edge.label.trim()&&edges.find(other=>direction(other)==='forward'&&!used.has(other.id)&&other.source===edge.target&&other.target===edge.source&&other.label.trim()===edge.label.trim()&&other.uncertain===edge.uncertain&&(other.weight||1)===(edge.weight||1)&&(other.color||'default')===(edge.color||'default'));
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
 function route(group,nodes,sizes=new Map()){
  const a=nodes.find(n=>n.id===group.edge.source),b=nodes.find(n=>n.id===group.edge.target);
  const size=n=>sizes.get(n.id)||{width:210,height:265},sa=size(a),sb=size(b),ac={x:a.x+sa.width/2,y:a.y+sa.height/2},bc={x:b.x+sb.width/2,y:b.y+sb.height/2};
  // A canonical normal prevents opposite directions from accidentally sharing a curve.
  const sign=a.id.localeCompare(b.id)<=0?1:-1,dx=(bc.x-ac.x)*sign,dy=(bc.y-ac.y)*sign,length=Math.hypot(dx,dy),normal=length?{x:-dy/length,y:dx/length}:{x:0,y:1};
  const control={x:(ac.x+bc.x)/2+(length?0:240)+normal.x*group.lane*2,y:(ac.y+bc.y)/2+normal.y*group.lane*2};
  function boundary(center,target,dimensions){let x=target.x-center.x,y=target.y-center.y;if(!x&&!y)x=1;const scale=1/Math.max(Math.abs(x)/(dimensions.width/2+4),Math.abs(y)/(dimensions.height/2+4));return {x:center.x+x*scale,y:center.y+y*scale};}
  const start=boundary(ac,control,sa),end=boundary(bc,control,sb);
  return {path:`M${start.x} ${start.y} Q${control.x} ${control.y} ${end.x} ${end.y}`,label:{x:(start.x+2*control.x+end.x)/4,y:(start.y+2*control.y+end.y)/4}};
 }
 function neighborhood(graph,focus,depth=1){
  if(!focus)return new Set(graph.nodes.map(n=>n.id));const seen=new Set([focus]);let frontier=[focus];
  for(let step=0;frontier.length&&step<depth;step++){const next=new Set();for(const edge of graph.edges){if(frontier.includes(edge.source)&&!seen.has(edge.target))next.add(edge.target);if(frontier.includes(edge.target)&&!seen.has(edge.source))next.add(edge.source);}frontier=[...next];frontier.forEach(id=>seen.add(id));}return seen;
 }
 const api={colors,ink,weight,MAX_COORDINATE,direction,connect,empty,validate,arrange,removeNode,displayEdges,route,neighborhood};if(typeof module!=='undefined')module.exports=api;else root.DiagramModel=api;
})(globalThis);

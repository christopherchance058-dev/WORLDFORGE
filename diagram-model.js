/* Reusable directed graphs. Domain meaning belongs to the workspace, not the canvas. */
(function(root){
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v),text=(v,n)=>typeof v==='string'&&v.length<=n,id=v=>text(v,120)&&!!v.trim();
 const Links=typeof module!=='undefined'?require('./description-links'):root.DescriptionLinks;
 const empty=()=>({nodes:[],edges:[]});
 function validate(graph){
  if(!object(graph)||!Array.isArray(graph.nodes)||graph.nodes.length>500||!Array.isArray(graph.edges)||graph.edges.length>2000)throw new Error('Use up to 500 diagram cards and 2000 connections.');
  const ids=new Set(),targets=new Set();for(const n of graph.nodes){if(!object(n)||!id(n.id)||ids.has(n.id)||!['entry','text'].includes(n.kind)||!text(n.label,120)||!n.label.trim()||!Number.isFinite(n.x)||!Number.isFinite(n.y)||Math.abs(n.x)>100000||Math.abs(n.y)>100000||(n.kind==='entry'&&(!id(n.entryId)||targets.has(n.entryId))))throw new Error('Diagram cards need unique IDs, labels and valid positions.');ids.add(n.id);if(n.kind==='entry')targets.add(n.entryId);}
  const edgeIds=new Set();for(const e of graph.edges){if(!object(e)||!id(e.id)||edgeIds.has(e.id)||!ids.has(e.source)||!ids.has(e.target)||e.source===e.target||!text(e.label,120)||!e.label.trim()||!text(e.notes,6000)||typeof e.uncertain!=='boolean')throw new Error('Connections need unique IDs, two different cards, wording and valid notes.');edgeIds.add(e.id);Links.validate(e);}
 }
 function arrange(graph){const columns=Math.max(1,Math.ceil(Math.sqrt(graph.nodes.length)));return {...graph,nodes:graph.nodes.map((n,i)=>({...n,x:60+(i%columns)*340,y:60+Math.floor(i/columns)*200}))};}
 function removeNode(graph,id){return {...graph,nodes:graph.nodes.filter(n=>n.id!==id),edges:graph.edges.filter(e=>e.source!==id&&e.target!==id)};}
 const api={empty,validate,arrange,removeNode};if(typeof module!=='undefined')module.exports=api;else root.DiagramModel=api;
})(globalThis);

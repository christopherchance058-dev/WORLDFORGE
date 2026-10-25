/* Read-only chronology projection and viewport geometry; never edits History records. */
(function(root){
 const History=typeof module!=='undefined'?require('./history-model'):root.HistoryModel;
 const MAX_YEAR=999999,MAX_SCALE=160;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 function view(center,scale,width){return {center:clamp(center,-MAX_YEAR,MAX_YEAR),scale:clamp(scale,width/2200000,MAX_SCALE)};}
 const xForYear=(year,center,scale,width)=>(year-center)*scale+width/2;
 const yearAtX=(x,center,scale,width)=>center+(x-width/2)/scale;
 function partition(entries){
  const result={dated:[],undated:[],named:[],invalid:[]};
  for(const entry of entries.filter(History.isHistory)){
   try{History.validate([entry]);const h=History.read(entry),start=History.startYear(entry),end=h.endDate?.year??null;
    if(start!==null&&!History.validYear(start))throw new Error('Invalid start year.');
    const record={entry,start,end,calendar:h.calendar.trim(),certainty:h.dateCertainty,type:History.eventTypeLabel(h.eventType)};
    result[record.calendar?'named':start===null?'undated':'dated'].push(record);
   }catch(error){result.invalid.push({entry,reason:error.message});}
  }
  return result;
 }
 function fit(records,width){if(!records.length)return view(0,width/100,width);let min=Infinity,max=-Infinity;for(const record of records){min=Math.min(min,record.start);max=Math.max(max,record.end??record.start);}return view((min+max)/2,width*.76/Math.max(20,max-min),width);}
 function zoom(center,scale,width,factor,x=width/2){const next=view(center,scale*factor,width),anchor=yearAtX(x,center,scale,width);return view(anchor-(x-width/2)/next.scale,next.scale,width);}
 function tickStep(scale){const needed=Math.max(1,100/scale),power=10**Math.floor(Math.log10(needed));return [1,2,5,10].map(n=>n*power).find(n=>n>=needed);}
 function ticks(center,scale,width){const step=tickStep(scale),first=Math.ceil(yearAtX(0,center,scale,width)/step)*step,result=[];for(let year=first;result.length<200&&xForYear(year,center,scale,width)<=width;year+=step)result.push({year:year===0?0:year,x:xForYear(year,center,scale,width)});return result;}
 // A min-heap frees the earliest available row in O(log n), even for dense histories.
 function push(heap,item){heap.push(item);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].right<=item.right)break;heap[i]=heap[p];i=p;}heap[i]=item;}
 function pop(heap){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].right<heap[j].right)j++;if(heap[j].right>=last.right)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;}
 function layout(records,center,scale,width,cardWidth){
  const left=yearAtX(0,center,scale,width),right=yearAtX(width,center,scale,width),heap=[];let rows=0;
  const visible=records.filter(r=>r.start<=right&&(r.end??r.start)>=left).map(r=>{
   const startX=xForYear(r.start,center,scale,width),endX=xForYear(r.end??r.start,center,scale,width),cardX=clamp(startX,12,Math.max(12,width-cardWidth-12));
   return {...r,startX,endX,cardX,left:Math.min(cardX,Math.max(0,startX)),right:Math.max(cardX+cardWidth,Math.min(width,endX))+16};
  }).sort((a,b)=>a.left-b.left||a.start-b.start||a.entry.title.localeCompare(b.entry.title));
  for(const record of visible){const row=heap.length&&heap[0].right<=record.left?pop(heap).row:rows++;record.row=row;push(heap,{right:record.right,row});}
  return {records:visible,rows};
 }
 const api={MAX_YEAR,MAX_SCALE,view,xForYear,yearAtX,partition,fit,zoom,tickStep,ticks,layout};if(typeof module!=='undefined')module.exports=api;else root.TimelineLayout=api;
})(globalThis);

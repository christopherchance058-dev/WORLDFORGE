const {test,expect}=require('./fixtures');
const Graph=require('../diagram-model');
const n=(id,x,y)=>({id,kind:'entry',entryId:id,label:id,x,y});
const edge=(id,source,target,label,extra={})=>({id,source,target,label,notes:'',uncertain:false,...extra});

test('display grouping preserves directed lore and separates reverse and parallel paths at different angles',()=>{
 for(const [x,y] of [[440,80],[100,440],[440,440],[80,80]]){
  const graph={nodes:[n('A',80,80),n('B',x,y)],edges:[edge('ab','A','B','preys on',{notes:'Only in winter',custom:'keep'}),edge('ba','B','A','stalks',{notes:'Never eats A'})]},before=structuredClone(graph),groups=Graph.displayEdges(graph),routes=groups.map(group=>Graph.route(group,graph.nodes));expect(groups).toHaveLength(2);expect(routes[0].path).not.toBe(routes[1].path);expect(Math.hypot(routes[0].label.x-routes[1].label.x,routes[0].label.y-routes[1].label.y)).toBeGreaterThan(10);expect(graph).toEqual(before);
  graph.edges[1].label='preys on';const mutual=Graph.displayEdges(graph);expect(mutual).toHaveLength(1);expect(mutual[0].mutual).toBe(true);expect(mutual[0].ids.sort()).toEqual(['ab','ba']);expect(graph.edges).toHaveLength(2);expect(graph.edges[0].notes).toBe('Only in winter');expect(graph.edges[1].notes).toBe('Never eats A');
  graph.edges.push(edge('another','A','B','guards'));expect(Graph.displayEdges(graph)).toHaveLength(2);graph.edges[1].uncertain=true;expect(Graph.displayEdges(graph)).toHaveLength(3);
 }
 const graph={nodes:[n('A',0,0),n('B',400,0),n('C',800,0),n('D',800,400)],edges:[edge('ab','A','B','feeds on'),edge('bc','B','C','shelters'),edge('ca','C','A','depends on'),edge('cd','C','D','protects')]};expect([...Graph.neighborhood(graph,'A',1)].sort()).toEqual(['A','B','C']);expect([...Graph.neighborhood(graph,'A',500)].sort()).toEqual(['A','B','C','D']);expect(Graph.displayEdges({...graph,edges:[edge('ab','A','B','Preys on'),edge('ba','B','A','preys on')]})).toHaveLength(2);
});

test('diagram appearances are backlinks without canvas membership requirements',async({page,request})=>{
 const H=require('./canvas-helpers');await H.seed(page,request);await H.open(page);await H.add(page,'The Order of the Lantern');await H.save(page);await page.locator('[data-node-id="a"]').click();await page.getByRole('button',{name:'Read entry',exact:true}).click();await expect(page.locator('#detail .universal-connections')).toContainText('Appears on canvas');await page.getByRole('button',{name:'Show on canvas: Story board',exact:true}).click();await expect(page.locator('#detail')).toBeHidden();await expect(page.locator('.diagram-focus-status')).toContainText('Showing connections');await page.keyboard.press('q');await expect(page.locator('.diagram-focus-status')).toBeHidden();
});

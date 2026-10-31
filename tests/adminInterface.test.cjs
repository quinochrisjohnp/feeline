const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { mount, nodes } = require('./helpers/frontendHarness.cjs');
const { paginate, pageNumbers } = require('../admin/src/lib/pagination.ts');

test('admin pagination splits 100 records into five complete pages without duplicates', () => {
  const records = Array.from({length:100}, (_,id)=>({id}));
  const pages = Array.from({length:5}, (_,i)=>paginate(records,i+1));
  for (const page of pages) { assert.equal(page.items.length,20); assert.equal(page.pageCount,5); }
  assert.deepEqual(pages.flatMap(page=>page.items),records);
  assert.deepEqual(pageNumbers(3,5),[1,2,3,4,5]);
  assert.deepEqual([pages[1].start,pages[1].end],[21,40]);
});
test('admin pagination handles empty lists, partial pages and shrinking filtered results', () => {
  assert.deepEqual(paginate([],6),{page:1,pageCount:1,total:0,start:0,end:0,items:[]});
  const records = Array.from({length:101},(_,id)=>id);
  assert.deepEqual(paginate(records,6).items,[100]);
  assert.equal(paginate(records.slice(0,3),6).page,1);
  assert.equal(paginate(records,-1).page,1);
  assert.equal(paginate(records,99).page,6);
  assert.deepEqual(pageNumbers(50,100),[1,'gap-49',49,50,51,'gap-100',100]);
});
test('pagination exposes active page, next/previous controls and empty-state boundaries', () => {
  const clicked=[];
  const render=(page,total)=>mount('admin/src/components/Pagination.tsx',{
    props:{...paginate(Array.from({length:total}),page),onPageChange:n=>clicked.push(n)},
    dependencies:{'@/lib/pagination':{pageNumbers}}
  }).render();
  let buttons=nodes(render(2,100)).filter(n=>n.type==='button');
  buttons.find(n=>n.props.children==='Previous').props.onClick();
  buttons.find(n=>n.props.children==='Next').props.onClick();
  buttons.find(n=>n.props['aria-label']==='Page 5').props.onClick();
  assert.deepEqual(clicked,[1,3,5]);
  assert.equal(buttons.find(n=>n.props['aria-current']==='page').props.children,2);
  buttons=nodes(render(1,0)).filter(n=>n.type==='button');
  assert.equal(buttons.find(n=>n.props.children==='Previous').props.disabled,true);
  assert.equal(buttons.find(n=>n.props.children==='Next').props.disabled,true);
});
test('all four lists filter before pagination and reset page on search; dashboard owns analytics',()=>{
  for(const name of ['Users','Cats','Detections','Feedback']){
    const source=fs.readFileSync(`admin/src/pages/${name}.tsx`,'utf8');
    assert.ok(source.includes(`paginate(filtered${name}, page)`));
    assert.match(source,/pagination.items.map/);
    assert.match(source,/setSearch\(event.target.value\); setPage\(1\)/);
    assert.match(source,/<Pagination/);
  }
  const dashboard=fs.readFileSync('admin/src/pages/Dashboard.tsx','utf8');
  assert.match(dashboard,/<Analytics \/>/);
  const sidebar=fs.readFileSync('admin/src/components/layout/AdminSidebar.tsx','utf8');
  assert.doesNotMatch(sidebar,/label: "Analytics"|label: "Recommendations"/);
});

test('feedback subject choices match mobile and combine with search before pagination', () => {
  const source = fs.readFileSync('admin/src/pages/Feedback.tsx','utf8');
  const mobile = fs.readFileSync('app/(screens)/settings-feedback.tsx','utf8');
  const options = text => [...text.match(/const SUBJECT_OPTIONS = \[([\s\S]*?)\]/)[1].matchAll(/"([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(options(source), options(mobile));
  const body = source.match(/const filteredFeedback = useMemo\(\(\) => \{([\s\S]*?)\}, \[feedback, search, subject\]\)/)[1];
  const filter = new Function('feedback','search','subject',body);
  const records = [
    {subject:'Bug Report',title:'Camera freezes',email:'a@example.com'},
    {subject:'Feature Suggestion',title:'Camera controls',email:'b@example.com'},
    {subject:'Bug Report',title:'Album display',email:'c@example.com'},
    {subject:null,title:'Older feedback',email:'d@example.com'},
  ];
  assert.equal(filter(records,'','').length,4);
  assert.deepEqual(filter(records,'','Bug Report'),[records[0],records[2]]);
  assert.deepEqual(filter(records,' CAMERA ','Bug Report'),[records[0]]);
  assert.equal(filter(records,'camera','Others').length,0);
  assert.match(source,/setSubject\(event.target.value\); setPage\(1\)/);
});

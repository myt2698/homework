const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const dir=path.resolve(__dirname,'..'), html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'element IDs are unique');
for(const [,file] of html.matchAll(/<script\s+src="([^"]+)"/g)){
 const source=fs.readFileSync(path.join(dir,file),'utf8');new vm.Script(source,{filename:file});
 if(file.startsWith('vendor/'))continue;
 for(const [,id] of source.matchAll(/\$\("#([^"\)]+)"\)/g))assert(ids.includes(id),`${file}: missing #${id}`);
}
for(const [,list] of html.matchAll(/aria-(?:controls|labelledby|describedby)="([^"]+)"/g))for(const id of list.split(/\s+/))assert(ids.includes(id),`missing ARIA target ${id}`);
console.log('Page scripts parse; static element bindings, unique IDs, and ARIA targets passed.');

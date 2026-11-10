import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const publicRoot=path.join(root,'public');
const refs=new Set(),missing=[];
const collect=value=>{
  if(typeof value==='string'&&/^\/?assets\/.+\.[a-z0-9]+$/i.test(value))refs.add(value.replace(/^\//,''));
  else if(Array.isArray(value))value.forEach(collect);
  else if(value&&typeof value==='object')Object.values(value).forEach(collect);
};
for(const name of fs.readdirSync(path.join(publicRoot,'assets'),{recursive:true})){
  if(name.endsWith('.json'))collect(JSON.parse(fs.readFileSync(path.join(publicRoot,'assets',name),'utf8')));
}
for(const name of ['index.html',...fs.readdirSync(path.join(root,'src')).filter(p=>/\.(js|css)$/.test(p)).map(p=>'src/'+p)]){
  const text=fs.readFileSync(path.join(root,name),'utf8');
  for(const match of text.matchAll(/["'`](\/?assets\/[^"'`\n]+)["'`]/g)){
    if(!match[1].includes('${'))collect(match[1]);
  }
}
for(const ref of refs){
  const file=path.resolve(publicRoot,ref);
  if(!file.startsWith(publicRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())missing.push(ref);
}
assert.deepEqual(missing,[],'Missing runtime assets');
console.log(JSON.stringify({passed:true,assetReferences:refs.size}));

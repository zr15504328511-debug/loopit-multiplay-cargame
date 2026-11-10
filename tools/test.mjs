import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
fs.mkdirSync(new URL('../output/playwright/',import.meta.url),{recursive:true});
const checks=['verify-assets.mjs','check.mjs','test-campaign.mjs','test-map-contact.mjs','test-scene-collisions.mjs','test-demo-room.mjs','test-room-lobby.mjs','test-room-items.mjs','test-room-progression.mjs'];
for(const name of checks){
  console.log(`\nRunning ${name}`);
  const result=spawnSync(process.execPath,[fileURLToPath(new URL(name,import.meta.url))],{cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
console.log(`\nPassed ${checks.length} check groups.`);

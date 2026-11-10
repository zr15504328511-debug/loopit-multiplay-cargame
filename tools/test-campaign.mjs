import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {newProfile,loadSave,storeSave,switchProfile,SAVE_KEY,LEGACY_BACKUP_KEY,upgradeCost,incomeMultiplier,purchaseUpgrade,distanceReward,upgradeAvailable} from '../src/save.js';
import {campaignEntry,physicalUpgrades,advanceCampaign} from '../src/campaign.js';
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const cases=[];
const test=(name,fn)=>{fn();cases.push({name,passed:true})};
test('Fresh campaign: zero coins, assigned SportsCar, no completed map',()=>{const s=loadSave();assert.equal(s.mode,'campaign');assert.equal(s.coins,0);assert.equal(s.car,'sports');assert.equal(s.level,'savannah');assert.equal(advanceCampaign(s),false)});
test('Exact legacy backup, preserved Practice values and independent profiles',()=>{
 const old={version:1,coins:1234,upgrades:{car:8,sling:3,income:2},car:'muscle',level:'west-coast',unlocked:['muscle','sports'],records:{savannah:{distance:716,wins:1,bestTime:35}},runs:9,muted:true};const raw=JSON.stringify(old);memory.set(SAVE_KEY,raw);let s=loadSave();assert.equal(s.mode,'practice');assert.equal(storeSave(s),true);assert.equal(memory.get(LEGACY_BACKUP_KEY),raw);for(const k of ['coins','upgrades','car','level','unlocked','records','runs','muted'])assert.deepEqual(s[k],old[k]);s=switchProfile(s,'campaign');assert.equal(s.coins,0);s.coins=31;assert(purchaseUpgrade(s,'car'));assert.equal(s.coins,1);s=switchProfile(s,'practice');assert.equal(s.coins,1234);assert.equal(s.upgrades.car,8);s=switchProfile(s,'campaign');assert.equal(s.upgrades.car,1);assert.equal(s.coins,1);
});
test('Per-level costs, total income multiplier and no invented purchase caps',()=>{
 const s=newProfile();assert.equal(upgradeCost(s,'car'),30);assert(!purchaseUpgrade(s,'car'));s.campaign.levelIndex=1;assert.equal(upgradeCost(s,'car'),97);assert.equal(incomeMultiplier(s),2);s.totals.income=7;s.upgrades.income=2;assert.equal(upgradeCost(s,'income'),512);assert.equal(incomeMultiplier(s),Math.fround(4*Math.fround(1.2)));s.upgrades.car=25;s.totals.car=25;s.upgrades.sling=20;s.totals.sling=20;s.upgrades.income=15;s.totals.income=15;for(const t of ['car','sling','income'])assert(upgradeAvailable(s,t));
});
test('Ordinary Next resets current build/best/attempts, retains coins/totals/partial sling; persisted Next is exactly once',()=>{
 const s=newProfile();s.coins=782;s.upgrades={car:21,sling:13,income:7};s.totals={...s.upgrades};s.campaign.bestDistance=716;s.campaign.levelAttempts=19;s.campaign.pendingResult={success:true,distance:716,reward:100};assert(storeSave(s));const r=loadSave();assert(r.campaign.pendingResult);assert(advanceCampaign(r));assert.equal(r.coins,782);assert.deepEqual(r.upgrades,{car:0,sling:0,income:0});assert.deepEqual(r.totals,{car:21,sling:13,income:7});assert.equal(physicalUpgrades(r).sling,3);assert.equal(r.car,'rally');assert.equal(r.campaign.bestDistance,0);assert.equal(r.campaign.levelAttempts,0);assert.equal(advanceCampaign(r),false);assert(storeSave(r));assert.equal(loadSave().campaign.levelIndex,1);
});
test('Ten sequential assignments, universe reset, repeating two-pattern catalog',()=>{
 const s=newProfile(),seen=[];for(let i=0;i<10;i++){seen.push(campaignEntry(s).car);s.coins=99;s.upgrades={car:25,sling:20,income:4};s.totals={car:25,sling:20,income:4};s.campaign.pendingResult={success:true};assert(advanceCampaign(s));if(i%5===4){assert.equal(s.coins,0);assert.deepEqual(s.totals,{car:0,sling:0,income:0})}else assert.equal(s.coins,99)}assert.deepEqual(seen,['sports','rally','supercar','formula','future','muscle','drift','supercar','formula','future']);assert.equal(s.campaign.universeIndex,2);assert.equal(s.car,'sports');
});
test('Campaign success reward uses absolute finish Z; failure uses achieved distance',()=>{const s=newProfile();assert.equal(distanceReward(s,716,true,{startZ:2,endZ:718}),718);assert.equal(distanceReward(s,35.79,false,{startZ:2,endZ:718}),35)});
test('Malformed and unavailable storage recover; purchase funds are checked',()=>{memory.set(SAVE_KEY,'broken');assert.equal(loadSave().coins,0);globalThis.localStorage={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};assert.equal(loadSave().mode,'campaign');assert.equal(storeSave(newProfile()),false)});
const report={timestamp:new Date().toISOString(),scope:'Production campaign/economy/save unit and migration checks',cases,sourceHashes:Object.fromEntries(['src/save.js','src/campaign.js','src/native-campaign.js'].map(f=>[f,createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};fs.writeFileSync('output/campaign-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

async page=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const key='car-evolve-local-room-v1',backup=key+'-before-campaign-upgrades';
  await page.setViewportSize({width:360,height:640});await page.bringToFront();await page.mouse.up();
  for(const k of ['KeyW','KeyA','KeyS','KeyD','Space'])await page.keyboard.up(k);
  const legacyBefore=await page.evaluate(()=>localStorage.getItem('car-evolve-webgl-study-v1'));
  await page.evaluate(({key,backup})=>{localStorage.removeItem(key);localStorage.removeItem(backup);},{key,backup});await page.reload();
  await page.waitForFunction(()=>window.game?.state==='lobby',null,{timeout:30000});
  await page.getByRole('button',{name:'Room settings',exact:true}).click();
  await page.getByLabel('Players',{exact:true}).fill('20');await page.getByLabel('Players',{exact:true}).press('Tab');
  await page.getByLabel('Name',{exact:true}).fill('Racer');await page.getByLabel('Name',{exact:true}).press('Tab');
  await page.getByRole('button',{name:'Close settings',exact:true}).click();
  const initial=await page.evaluate(()=>({coins:game.room.garage.coins,build:game.room.upgrades,hasWheels:game.sim.stats.hasWheels,damping:game.sim.stats.groundDamping,force:game.sim.stats.springForce,prices:game.room.snapshot().upgrades.map(u=>u.price),identities:game.room.players.map(p=>[p.carId,p.color])}));
  if(initial.coins!==0||initial.build.car!==0||initial.build.sling!==0||initial.hasWheels||JSON.stringify(initial.prices)!=='[30,30,30]'||new Set(initial.identities.map(p=>p.join(':'))).size!==20)throw Error('Fresh campaign defaults failed');
  for(const type of ['Car','Slingshot','Income'])if(!await page.getByRole('button',{name:'Upgrade '+type,exact:true}).isDisabled())throw Error('Zero funds did not disable upgrade');
  await page.locator('#stage').screenshot({path:'output/playwright/room-original-fresh.png'});
  async function flight(){
    await page.keyboard.down('KeyW');try{await page.waitForFunction(()=>game.state==='ready',null,{timeout:15000});}finally{await page.keyboard.up('KeyW');}
    const active=await page.evaluate(()=>({build:{...game.sim.upgrades},damping:game.sim.stats.groundDamping,force:game.sim.stats.springForce,namesHidden:document.querySelector('.room-car-names').hidden}));
    const box=await page.locator('#game').boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height*.3);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height*.7,{steps:8});await page.mouse.up();
    await page.waitForFunction(()=>game.state==='running'&&!game.sim.springActive&&game.sim.elapsed>1.4,null,{timeout:15000});
    await page.locator('#item-button').click();
    await page.waitForFunction(()=>game.state==='lobby',null,{timeout:60000});
    return await page.evaluate(active=>({active,last:{...game.room.lastRun},coins:game.room.garage.coins}),active);
  }
  const earned=[];let balance=0;
  while(balance<90&&earned.length<4){const f=await flight();if(f.last.reward!==Math.trunc(Math.fround(f.last.distance))||f.coins!==balance+f.last.reward)throw Error('Initial flight reward is not the original distance reward');earned.push(f);balance=f.coins;}
  if(balance<90)throw Error('Natural earnings did not fund the three initial purchases');
  for(const type of ['Car','Slingshot','Income'])await page.getByRole('button',{name:'Upgrade '+type,exact:true}).click();
  const purchased=await page.evaluate(()=>({coins:game.room.garage.coins,counts:{...game.room.progression.upgrades},build:game.room.upgrades,prices:game.room.snapshot().upgrades.map(u=>u.price),pips:[...document.querySelectorAll('.room-upgrade-pips')].map(n=>n.querySelectorAll('.filled').length)}));
  if(purchased.coins!==balance-90||JSON.stringify(purchased.counts)!=='{"car":1,"sling":1,"income":1}'||JSON.stringify(purchased.prices)!=='[37,37,45]'||purchased.pips.some(n=>n!==2))throw Error('One-step purchase, price or pip display failed');
  await page.locator('#stage').screenshot({path:'output/playwright/room-original-upgrades.png'});
  const names=await page.locator('.room-car-name:not([hidden])').allTextContents();if(!names.includes('Racer'))throw Error('Lobby name missing');
  await page.getByRole('button',{name:'Leaderboard',exact:true}).click();
  const position=await page.evaluate(()=>({x:game.lobby.local.x,z:game.lobby.local.z}));
  await page.keyboard.down('KeyW');await page.waitForTimeout(350);await page.keyboard.up('KeyW');
  if(!await page.evaluate(p=>game.lobby.local.x===p.x&&game.lobby.local.z===p.z,position))throw Error('Driving moved behind leaderboard');
  await page.getByRole('button',{name:'Next map records'}).click();
  if(await page.evaluate(()=>game.room.mapId)!=='savannah'||!await page.getByText('No records yet',{exact:true}).isVisible())throw Error('Leaderboard map browsing changed the game');
  await page.keyboard.press('Escape');
  const finish=await flight();
  const multiplier=Math.fround(1+Math.fround(.1)),expected=Math.trunc(Math.fround(finish.last.distance*multiplier));
  if(finish.last.reward!==expected||finish.coins!==purchased.coins+expected||finish.active.damping>=initial.damping||finish.active.force<=initial.force||finish.active.build.car!==1||finish.active.build.sling!==1||!finish.active.namesHidden)throw Error('Upgraded launch or income failed');
  await page.getByRole('button',{name:'Leaderboard',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.room-board-row[data-player="you"]'));
  await page.locator('#stage').screenshot({path:'output/playwright/room-original-leaderboard.png'});await page.getByRole('button',{name:'Close leaderboard',exact:true}).click();
  await page.reload();await page.waitForFunction(()=>window.game?.state==='lobby');
  const persisted=await page.evaluate(()=>({coins:game.room.garage.coins,counts:{...game.room.progression.upgrades},best:game.room.local.best}));
  if(persisted.coins!==finish.coins||persisted.best!==finish.last.best||JSON.stringify(persisted.counts)!==JSON.stringify(purchased.counts))throw Error('Progress did not survive reload');
  const fullBoard=await page.evaluate(async()=>{
    const {createRoomUI}=await import('/src/room-ui.js'),stage=document.createElement('div');stage.style.cssText='position:absolute;left:-1000px;top:0;width:400px;height:580px';document.body.append(stage);
    const ui=createRoomUI({stage}),s=game.roomSnapshot();s.leaderboards.savannah=s.players.map((p,i)=>({...p,best:450-i*10,rank:i+1}));ui.showLobby(s);ui.root.querySelector('.room-ranking-toggle').click();
    const list=ui.root.querySelector('.room-board-list'),r={rows:list.children.length,scrollable:list.scrollHeight>list.clientHeight};ui.destroy();stage.remove();return r;
  });
  if(fullBoard.rows!==20||!fullBoard.scrollable)throw Error('Full-room ranking layout failed');
  // The following are explicit persistence/loader fixtures, not route completions.
  const naturalSave=await page.evaluate(key=>localStorage.getItem(key),key);
  const old={version:2,name:'Old Racer',count:8,mapId:'savannah',completed:['savannah'],records:{savannah:{you:{best:150,position:[0,1,160]}}},garage:{coins:310,levels:{car:1,sling:2,income:3}}};
  const raw=JSON.stringify(old);
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await page.reload();await page.waitForFunction(()=>window.game?.state==='lobby');
  const migration=await page.evaluate(({key,backup,raw})=>({coins:game.room.garage.coins,build:game.room.upgrades,best:game.room.local.best,unlocked:game.room.isUnlocked('ski-resort'),backupExact:localStorage.getItem(backup)===raw,rules:JSON.parse(localStorage.getItem(key)).garage.rules}),{key,backup,raw});
  if(migration.coins!==310||migration.build.car!==15||migration.build.sling!==12||migration.best!==150||!migration.unlocked||!migration.backupExact||migration.rules!==1)throw Error('Legacy room migration failed');
  const boundary={...old,version:3,garage:{rules:1,coins:200,totals:{car:5,sling:7,income:5},builds:{savannah:{car:5,sling:7,income:5}},universeIndex:0,frontier:0}};
  await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:boundary});await page.reload();await page.waitForFunction(()=>window.game?.state==='lobby');
  await page.evaluate(()=>game.loadLevel('ski-resort'));await page.waitForFunction(()=>game.state==='lobby'&&game.room.mapId==='ski-resort');
  const nextMap=await page.evaluate(()=>({coins:game.room.garage.coins,counts:{...game.room.progression.upgrades},build:game.room.upgrades,prices:game.room.snapshot().upgrades.map(u=>u.price)}));
  if(nextMap.coins!==200||JSON.stringify(nextMap.counts)!=='{"car":0,"sling":0,"income":0}'||nextMap.build.sling!==2||JSON.stringify(nextMap.prices)!=='[97,97,227]')throw Error('Next-map load reset failed');
  await page.getByRole('button',{name:'Upgrade Car',exact:true}).click();await page.reload();await page.waitForFunction(()=>window.game?.state==='lobby');
  if(!await page.evaluate(()=>game.room.garage.coins===103&&game.room.progression.upgrades.car===1))throw Error('Next-map purchase was reset again on reload');
  const roundFixture={...boundary,mapId:'savannah',completed:['savannah','ski-resort','west-coast','formula','rainbow-road'],garage:{...boundary.garage,coins:1234,frontier:4,builds:{savannah:{car:5,sling:7,income:5}}}};
  await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:roundFixture});await page.reload();await page.waitForFunction(()=>window.game?.state==='lobby');
  if(!await page.evaluate(()=>game.room.garage.coins===1234&&game.room.nextRoundReady))throw Error('Reload silently reset a completed round');
  await page.keyboard.down('KeyW');try{await page.waitForFunction(()=>game.state==='ready',null,{timeout:15000});}finally{await page.keyboard.up('KeyW');}
  const nextRound=await page.evaluate(()=>({coins:game.room.garage.coins,build:game.room.upgrades,totals:game.room.garage.totals,round:game.room.garage.universeIndex,completed:game.room.completed,locked:!game.room.isUnlocked('ski-resort')}));
  if(nextRound.coins!==0||nextRound.round!==1||nextRound.completed.length||!nextRound.locked||Object.values(nextRound.totals).some(Boolean)||Object.values(nextRound.build).some(Boolean))throw Error('Next-round reset failed');
  await page.evaluate(({key,backup,raw})=>{localStorage.setItem(key,raw);localStorage.removeItem(backup);},{key,backup,raw:naturalSave});await page.reload();await page.waitForFunction(()=>window.game?.state==='lobby');
  const solo=await page.context().newPage();solo.on('pageerror',e=>errors.push('solo: '+e.message));await solo.goto(new URL('/?mode=solo',page.url()).href);await solo.waitForFunction(()=>window.game&&game.state!=='loading');
  const legacy=await solo.evaluate(()=>({mode:document.body.classList.contains('room-demo'),room:!!document.querySelector('#room-ui'),gl:document.querySelector('#game').getContext('webgl2').getError()}));await solo.close();await page.bringToFront();
  const legacyAfter=await page.evaluate(()=>localStorage.getItem('car-evolve-webgl-study-v1'));
  if(legacy.mode||legacy.room||legacy.gl||legacyBefore!==legacyAfter)throw Error('Solo mode regression');
  await page.locator('#stage').screenshot({path:'output/playwright/room-original-final.png'});
  const gl=await page.evaluate(()=>document.querySelector('#game').getContext('webgl2').getError());if(errors.length||gl)throw Error(JSON.stringify({errors,gl}));
  return {passed:true,initial,earned,purchased,finish,persisted,fullBoard,migration,nextMap,nextRound,legacyPreserved:legacyBefore===legacyAfter,gl,errors};
}

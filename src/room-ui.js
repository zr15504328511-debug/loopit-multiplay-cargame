const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const icon=(file)=>{const n=el('img');n.src='/assets/native-ui/'+file;n.alt='';n.draggable=false;return n;};
const own=(p,data)=>p.isLocal||p.id===data.localId;
const safeColor=value=>/^#[a-f\d]{6}$/i.test(value)?value:'#fff';
// Keep the field of view clear even in a full room: only three portraits.
// Remaining active participants have tiny record ticks, never more portraits.
export function railPlayers(data) {
  const active=(data.players||[]).filter(p=>p.participating&&(own(p,data)||p.status==='flying'));
  const local=active.find(p=>own(p,data));
  const others=active.filter(p=>!own(p,data)).sort((a,b)=>Math.abs((a.distance||0)-(local?.distance||0))-Math.abs((b.distance||0)-(local?.distance||0)));
  return {portraits:[...(local?[local]:[]),...others.slice(0,2)],ticks:others.slice(2)};
}
export function createRoomUI({stage,onCountChange=()=>{},onNameChange=()=>{},onItemChange=()=>{},onReturn=()=>{},onDrive=()=>{},onUpgrade=()=>{}}) {
  const root=el('div','room-ui');root.id='room-ui';
  const lobby=el('section','room-lobby');lobby.hidden=true;lobby.setAttribute('aria-label','Drive to a slingshot');
  const settings=el('button','room-settings-toggle');settings.type='button';settings.append(icon('settings-188.png'));settings.setAttribute('aria-label','Room settings');
  const wallet=el('div','room-wallet'),coins=el('b');wallet.append(icon('sprites_0-3.png'),coins);wallet.setAttribute('aria-label','Coins');
  const ranking=el('button','room-ranking-toggle');ranking.type='button';ranking.setAttribute('aria-label','Leaderboard');
  ranking.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 4h14v10c0 5-3 8-7 8s-7-3-7-8V4Z" fill="#ffd100" stroke="#fff" stroke-width="1.5"/><path d="M9 7H4v5c0 4 3 6 7 6M23 7h5v5c0 4-3 6-7 6" fill="none" stroke="#ffd100" stroke-width="3"/><path d="M14 21h4v5h6v4H8v-4h6Z" fill="#ffd100"/></svg>';
  const upgrades=el('div','room-upgrade-dock');upgrades.setAttribute('aria-label','Lobby upgrades');
  const upgradeNodes=new Map();
  for(const [type,title,file] of [['sling','Slingshot','slingshot-187.png'],['car','Car','car-178.png'],['income','Income','income1-179.png']]) {
    const b=el('button','room-upgrade');b.type='button';b.dataset.roomUpgrade=type;b.setAttribute('aria-label',`Upgrade ${title}`);
    const level=el('i','room-upgrade-level','1'),price=el('span','room-upgrade-price'),amount=el('b');price.append(amount,icon('sprites_0-3.png'));
    const picture=icon(file);picture.className='room-upgrade-picture';b.append(el('span','room-upgrade-title',title),picture,level,price);
    b.onclick=()=>onUpgrade(type);upgrades.append(b);upgradeNodes.set(type,{button:b,level,amount,coin:price.lastElementChild});
  }
  const drawer=el('section','room-settings-drawer');drawer.id='room-settings-drawer';drawer.hidden=true;
  const heading=el('div','room-settings-heading'),close=el('button','room-settings-close','×');close.type='button';close.setAttribute('aria-label','Close settings');
  heading.append(el('strong','','Settings'),close);
  const nameLabel=el('label','room-field','Name'),name=el('input');name.id='room-player-name';name.maxLength=18;name.autocomplete='off';nameLabel.append(name);
  const countLabel=el('label','room-field','Players'),count=el('input');count.id='room-player-count';count.type='number';count.min=1;count.max=20;countLabel.append(count);
  const items=el('div','room-item-list');items.setAttribute('aria-label','One item per flight');
  for(const [id,label,symbol] of [['pepper','Boost','↗'],['glider','Glider','⌁']]) {
    const b=el('button','room-item');b.type='button';b.dataset.item=id;b.setAttribute('aria-label',label);b.append(el('b','',symbol),el('span','',label));b.onclick=()=>onItemChange(id);items.append(b);
  }
  drawer.append(heading,nameLabel,countLabel,items,el('p','room-demo-note','AI demo · 20 max'));
  const joystick=el('div','room-joystick');joystick.setAttribute('role','group');joystick.setAttribute('aria-label','Drag to drive, or use WASD');joystick.tabIndex=0;
  const thumb=el('div','room-joystick-thumb');joystick.append(thumb);
  const hint=el('div','room-drive-hint','Drive to a slingshot');
  lobby.append(ranking,wallet,settings,drawer,joystick,hint,upgrades);
  const boardOverlay=el('div','room-board-overlay');boardOverlay.hidden=true;
  const board=el('section','room-board');board.setAttribute('role','dialog');board.setAttribute('aria-modal','true');board.setAttribute('aria-label','Leaderboard');
  const boardHeader=el('div','room-board-heading'),boardClose=el('button','room-settings-close','×');boardClose.type='button';boardClose.setAttribute('aria-label','Close leaderboard');boardHeader.append(el('strong','','Leaderboard'),boardClose);
  const boardMaps=el('div','room-board-maps'),previous=el('button','','‹'),next=el('button','','›'),boardMap=el('strong');
  previous.type=next.type='button';previous.setAttribute('aria-label','Previous map records');next.setAttribute('aria-label','Next map records');boardMaps.append(previous,boardMap,next);
  const boardList=el('div','room-board-list');boardList.setAttribute('role','list');
  const boardEmpty=el('p','room-board-empty','No records yet'),boardFoot=el('div','room-board-foot','Room · AI demo');
  board.append(boardHeader,boardMaps,boardList,boardEmpty,boardFoot);boardOverlay.append(board);
  const flight=el('div','room-flight');flight.hidden=true;
  const back=el('button','room-back','‹');back.id='room-return';back.type='button';back.setAttribute('aria-label','Return to lobby');back.onclick=onReturn;
  flight.append(back);
  const rail=el('aside','room-records');rail.hidden=true;rail.setAttribute('aria-label','Participating players’ best records');
  const finish=icon('finish-197.png');finish.className='room-record-finish';
  const track=el('div','room-records-track'),fill=el('i','room-records-fill'),markers=el('div','room-records-markers');track.append(fill);rail.append(finish,track,markers);
  const notice=el('div','room-notice');notice.hidden=true;notice.setAttribute('role','status');
  root.append(lobby,flight,rail,notice,boardOverlay);stage.append(root);
  const gameInterface=stage.querySelector('#interface');let snapshot=null,noticeTimer=null,pointer=null,driven=false,lastRailKey='',boardMapId=null,boardKey='';
  function release(){pointer=null;thumb.style.transform='translate(0,0)';onDrive({steer:0,throttle:0});}
  function setSettingsOpen(open){drawer.hidden=!open;settings.setAttribute('aria-expanded',String(open));root.classList.toggle('settings-open',open);release();if(!open&&drawer.contains(document.activeElement))document.activeElement.blur();}
  function setBoardOpen(open) {
    boardOverlay.hidden=!open;root.classList.toggle('dialog-open',open);release();
    if(open){setSettingsOpen(false);boardMapId=snapshot?.map?.id;boardKey='';updateBoard();boardClose.focus();}
    else if(board.contains(document.activeElement))ranking.focus();
  }
  ranking.onclick=()=>setBoardOpen(true);boardClose.onclick=()=>setBoardOpen(false);
  boardOverlay.onclick=e=>{if(e.target===boardOverlay)setBoardOpen(false);};
  function browseRecords(step){const maps=snapshot?.maps||[],i=maps.findIndex(m=>m.id===boardMapId);boardMapId=maps[(i+step+maps.length)%maps.length]?.id;boardKey='';boardList.scrollTop=0;updateBoard();}
  previous.onclick=()=>browseRecords(-1);next.onclick=()=>browseRecords(1);
  function updateBoard() {
    if(boardOverlay.hidden||!snapshot)return;
    const map=snapshot.maps.find(m=>m.id===boardMapId)||snapshot.map;boardMap.textContent=map.title;
    const rows=snapshot.leaderboards?.[map.id]||[];boardEmpty.hidden=!!rows.length;
    const key=JSON.stringify([map.id,rows.map(p=>[p.id,p.name,Math.floor(p.best)])]);if(key===boardKey)return;boardKey=key;
    const scroll=boardList.scrollTop;
    boardList.replaceChildren(...rows.map(p=>{
      const row=el('div','room-board-row'+(p.isLocal?' is-local':''));row.setAttribute('role','listitem');row.dataset.player=p.id;
      const portrait=el('img','room-board-avatar');portrait.src=p.avatar;portrait.alt='';portrait.style.borderColor=p.color;
      row.append(el('b','room-board-rank',String(p.rank)),portrait,el('span','room-board-name',p.name),el('b','room-board-distance',`${Math.floor(p.best)} m`));return row;
    }));boardList.scrollTop=scroll;
  }
  settings.onclick=()=>setSettingsOpen(drawer.hidden);close.onclick=()=>setSettingsOpen(false);
  name.onchange=()=>onNameChange(name.value.trim().slice(0,18)||'You');
  count.onchange=()=>onCountChange(Math.max(1,Math.min(20,Math.round(Number(count.value)||1))));
  function drive(e) {
    if(e.pointerId!==pointer)return;const b=joystick.getBoundingClientRect(),scale=b.width/84;
    let x=(e.clientX-(b.left+b.width/2))/scale,y=(e.clientY-(b.top+b.height/2))/scale;
    const d=Math.hypot(x,y);if(d>29){x*=29/d;y*=29/d;}
    thumb.style.transform=`translate(${x}px,${y}px)`;driven=true;hint.hidden=true;
    onDrive({steer:x/29,throttle:-y/29});
  }
  joystick.onpointerdown=e=>{if(!drawer.hidden||!boardOverlay.hidden||snapshot?.busy)return;e.preventDefault();pointer=e.pointerId;joystick.setPointerCapture(pointer);drive(e);};
  joystick.onpointermove=drive;joystick.onpointerup=joystick.onpointercancel=joystick.onlostpointercapture=release;
  window.addEventListener('blur',release);
  for(const type of ['pointerdown','pointermove','pointerup','click','wheel'])root.addEventListener(type,e=>e.stopPropagation());
  root.addEventListener('keydown',e=>{
    if(!boardOverlay.hidden){if(e.key==='Escape'){e.preventDefault();setBoardOpen(false);}if(e.key==='Tab'){const focus=[boardClose,previous,next],i=focus.indexOf(document.activeElement);e.preventDefault();focus[(i+(e.shiftKey?-1:1)+focus.length)%focus.length].focus();}e.stopPropagation();return;}
    if(e.key==='Escape'&&!drawer.hidden)setSettingsOpen(false);if(!drawer.hidden||e.target.matches('input'))e.stopPropagation();
  });
  function updateRail(data) {
    rail.hidden=!lobby.hidden||flight.hidden||data.phase!=='running';
    if(rail.hidden)return;
    const {portraits,ticks}=railPlayers(data),length=Math.max(1,data.map?.length||1),local=data.players.find(p=>own(p,data));
    fill.style.height=`${Math.min(100,(local?.distance||0)/length*100)}%`;
    const key=JSON.stringify([portraits.map(p=>[p.id,p.best,p.avatar,p.name]),ticks.map(p=>[p.id,p.best])]);if(key===lastRailKey)return;lastRailKey=key;
    const positions=portraits.map(p=>({p,y:Math.max(0,Math.min(166,(1-(p.best||0)/length)*166))})).sort((a,b)=>a.y-b.y);
    for(let i=1;i<positions.length;i++)positions[i].y=Math.max(positions[i].y,positions[i-1].y+15);
    for(let i=positions.length-1;i>=0;i--)positions[i].y=Math.min(positions[i].y,i===positions.length-1?166:positions[i+1].y-15);
    const nodes=positions.map(({p,y})=>{
      const n=el('button','room-record-avatar'+(own(p,data)?' is-local':''));n.type='button';n.dataset.player=p.id;n.style.top=y+'px';n.style.borderColor=safeColor(p.color);
      const img=el('img');img.src=p.avatar;img.alt='';n.append(img);n.title=`${p.name} · ${Math.floor(p.best||0)} m`;n.setAttribute('aria-label',n.title);return n;
    });
    for(const p of ticks){const n=el('i','room-record-tick');n.style.top=`${Math.max(0,Math.min(176,(1-(p.best||0)/length)*176))}px`;n.style.background=safeColor(p.color);nodes.push(n);}
    markers.replaceChildren(...nodes);
  }
  function update(data) {
    if(!data)return;snapshot=data;
    if(!lobby.hidden) {
      coins.textContent=Math.floor(data.coins||0).toLocaleString('en-US');
      for(const u of data.upgrades||[]) {
        const n=upgradeNodes.get(u.type);if(!n)continue;n.level.textContent=u.level;n.amount.textContent=u.max?'MAX':u.price;n.coin.hidden=u.max;
        n.button.disabled=!!data.busy||u.max||data.coins<u.price;n.button.classList.toggle('is-max',u.max);
        n.button.title=u.type==='income'?`Income ×${Number(u.income).toFixed(1)}`:u.type==='car'?'Improve coasting and vehicle parts':'Increase launch strength';
      }
      const local=data.players.find(p=>own(p,data));
      if(document.activeElement!==name)name.value=local?.name||'You';
      if(document.activeElement!==count)count.value=data.players.length;
      for(const b of items.children){b.classList.toggle('selected',b.dataset.item===data.selectedItem);b.setAttribute('aria-pressed',String(b.dataset.item===data.selectedItem));b.disabled=!!data.busy;}
      name.disabled=count.disabled=!!data.busy;
      if(data.moving){driven=true;hint.hidden=true;}
      if(data.nearPortal?.locked){hint.textContent='Locked';hint.hidden=false;}
      else {hint.textContent='Drive to a slingshot';hint.hidden=driven;}
    }
    updateBoard();
    updateRail(data);
  }
  function showNotice(text){notice.textContent=String(text||'');notice.hidden=!text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.hidden=true,2600);}
  return {root,get isSettingsOpen(){return !drawer.hidden||!boardOverlay.hidden;},update,showNotice,
    showLobby(data=snapshot){lobby.hidden=false;flight.hidden=true;rail.hidden=true;root.classList.add('is-lobby');if(gameInterface)gameInterface.inert=true;setSettingsOpen(false);setBoardOpen(false);update(data);},
    hideLobby(){lobby.hidden=true;root.classList.remove('is-lobby');if(gameInterface)gameInterface.inert=false;setSettingsOpen(false);setBoardOpen(false);release();},
    setFlightVisible(visible){flight.hidden=!visible;if(visible){lobby.hidden=true;root.classList.remove('is-lobby');if(gameInterface)gameInterface.inert=false;release();}else rail.hidden=true;},
    destroy(){release();clearTimeout(noticeTimer);window.removeEventListener('blur',release);if(gameInterface)gameInterface.inert=false;root.remove();}
  };
}

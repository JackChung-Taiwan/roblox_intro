(function(){
'use strict';
const $=s=>document.querySelector(s), cv=$('#cv'), ctx=cv.getContext('2d');
const W=cv.width,H=cv.height, keys={};
const levels=[
 {no:4,title:'會動的救援平台',badge:'移動與速度',concept:'速度、座標與碰撞',task:'搭上移動平台，穿越天空缺口，到達右側終點。',intro:'平台移動得太快，先觀察它的行為，再下指令讓關卡更合理。',type:'moving',controls:'方向鍵／WASD 移動・看準平台位置',options:[
  ['slow','把移動平台速度調慢一點','平台速度降低，玩家更容易判斷時機。'],['wide','把移動平台變成兩倍寬','碰撞範圍變大，容錯率提高。'],['checkpoint','在中間加一個檢查點','掉落後會從中間重新開始。'],['neon','把平台改成霓虹紫色','只改造外觀，不改變遊戲規則。','style'] ]},
 {no:5,title:'一下出現、一下消失的橋',badge:'時間與迴圈',concept:'計時器、迴圈與節奏',task:'看準橋面出現的時間，走到右側終點。',intro:'橋面會按照計時器反覆出現與消失。你可以調整週期，也可以改變出現方式。',type:'bridge',controls:'方向鍵／WASD 移動',options:[
  ['long','讓每塊橋停留久一點','橋面可見時間增加，節奏更容易掌握。'],['together','讓所有橋面一起出現','原本錯開的迴圈改成同步。'],['safe','在橋下加一條安全道路','新增不會消失的備用路線。'],['ice','把橋變成冰晶風格','加入透明冰藍視覺效果。','style'] ]},
 {no:6,title:'雷射密碼門',badge:'條件與順序',concept:'條件判斷、事件與順序',task:'依照正確順序啟動三個按鈕，再通過雷射門。',intro:'門只會在條件成立時打開。先看提示，再依序碰到紅、藍、黃按鈕。',type:'laser',controls:'方向鍵／WASD 移動',options:[
  ['hint','在地板加上順序箭頭','提示路線會顯示紅 → 藍 → 黃。'],['laserSlow','讓雷射閃爍慢一點','雷射關閉時間變長，更容易通過。'],['oneOff','關掉最靠近終點的雷射','移除一個障礙，但仍要完成密碼順序。'],['cyber','改成賽博城市風格','加入深色地板與霓虹線條。','style'] ]},
 {no:7,title:'金幣迷宮控制室',badge:'變數與計數',concept:'變數、計數器與解鎖條件',task:'收集足夠金幣，讓出口變成綠色並離開迷宮。',intro:'出口會讀取「金幣數量」這個變數。只有收集數量達標，門才會解鎖。',type:'maze',controls:'方向鍵／WASD 移動',options:[
  ['goal3','把過關條件改成 3 枚金幣','解鎖條件從 5 改成 3。'],['trail','在正確路線加上腳印','路線提示會沿著較安全的方向出現。'],['radar','在右上角顯示金幣雷達','顯示最近一枚金幣的方向。'],['forest','把迷宮改成森林遺跡','牆面換成綠色石磚與藤蔓風格。','style'] ]},
 {no:8,title:'怪物追逐・終極改造',badge:'NPC 行為',concept:'NPC 速度、追蹤與安全區',task:'取得能源核心後，在怪物追上你之前逃到出口。',intro:'怪物會持續計算你的位置並追蹤。你可以修改敵人速度、玩家能力或場景規則。',type:'chase',controls:'方向鍵／WASD 移動・空白鍵短暫衝刺',options:[
  ['enemySlow','讓怪物移動慢一點','NPC 追蹤速度降低。'],['boost','給玩家一個衝刺能力','按空白鍵可短暫加速。'],['safeZone','加入兩個安全區','站在安全區時，怪物會暫停追蹤。'],['space','把關卡改成太空基地','加入星空、能源線與太空配色。','style'] ]}
];
let idx=0,totalCommands=0,wins=0,running=false,won=false,last=performance.now();
let state=null;
function baseState(){return {player:{x:55,y:H/2,r:13,v:150},goal:{x:W-58,y:H/2,w:34,h:70},used:new Set(),t:0,coins:0,order:[],dead:0,style:'default',checkpoint:null,dash:0,trail:[]};}
function initState(){state=baseState();running=false;won=false;const L=levels[idx];
 if(L.type==='moving') Object.assign(state,{platformX:260,platformDir:1,platformSpeed:170,platformW:95,jump:0,vy:0,onPlatform:false});
 if(L.type==='bridge') Object.assign(state,{bridgePeriod:1.4,bridgeLong:false,bridgeTogether:false,safe:false});
 if(L.type==='laser') Object.assign(state,{laserPeriod:1.2,sequence:['red','blue','yellow'],disabledLaser:false});
 if(L.type==='maze') Object.assign(state,{goalCoins:5,radar:false,showTrail:false,coinList:[[130,92],[300,82],[472,104],[198,365],[620,380]]});
 if(L.type==='chase') Object.assign(state,{enemy:{x:W-180,y:95,r:16},enemySpeed:92,hasCore:false,boost:false,safeZones:false,core:{x:W/2,y:H/2}});
}
function progress(){const p=$('#progress');p.innerHTML='';levels.forEach((l,i)=>{const s=document.createElement('span');s.className='pstep'+(i===idx?' on':i<idx?' done':'');s.textContent='第 '+l.no+' 關';p.appendChild(s);if(i<levels.length-1){const a=document.createElement('span');a.className='arrow';a.textContent='›';p.appendChild(a)}});}
function msg(html){const m=document.createElement('div');m.className='msg';m.innerHTML='<span class="av">🧱</span><div class="bub">'+html+'</div>';$('#chat').appendChild(m);$('#chat').scrollTop=$('#chat').scrollHeight;}
function renderUI(){const L=levels[idx];progress();$('#levelTitle').innerHTML='<b>第 '+L.no+' 關</b>・'+L.title;$('#levelBadge').textContent='🧠 '+L.badge;$('#assistantSub').textContent='第 '+L.no+' 關・'+L.concept;$('#controls').textContent=L.controls;$('#counter').textContent='🔧 '+state.used.size;$('#chat').innerHTML='<div class="task"><b>🎯 任務：'+L.task+'</b><p>'+L.intro+'</p></div><span class="concept">🧠 這關偷偷在學：'+L.concept+'</span><div class="msg"><span class="av">🧱</span><div class="bub">先看看場景，再選一句話讓我修改。每個選項都會直接改變遊戲規則或外觀。</div></div><div class="options" id="options"></div>';
 const opts=$('#options');L.options.forEach(o=>{const b=document.createElement('button');b.className='opt '+(o[3]||'');b.type='button';b.dataset.op=o[0];b.innerHTML=o[1];b.addEventListener('click',()=>applyOption(o,b));opts.appendChild(b)});
 $('#playBtn').textContent='▶ 玩玩看';$('#playBtn').className='btn playbtn';$('#nextBtn').hidden=true;$('#toast').classList.remove('show');setMode(false);draw();}
function applyOption(o,b){if(running||state.used.has(o[0]))return;state.used.add(o[0]);b.classList.add('used');totalCommands++;const op=o[0];
 if(op==='slow')state.platformSpeed=85;if(op==='wide')state.platformW=180;if(op==='checkpoint')state.checkpoint={x:370,y:H/2};if(op==='neon')state.style='neon';
 if(op==='long')state.bridgeLong=true;if(op==='together')state.bridgeTogether=true;if(op==='safe')state.safe=true;if(op==='ice')state.style='ice';
 if(op==='hint')state.showHint=true;if(op==='laserSlow')state.laserPeriod=2.2;if(op==='oneOff')state.disabledLaser=true;if(op==='cyber')state.style='cyber';
 if(op==='goal3')state.goalCoins=3;if(op==='trail')state.showTrail=true;if(op==='radar')state.radar=true;if(op==='forest')state.style='forest';
 if(op==='enemySlow')state.enemySpeed=58;if(op==='boost')state.boost=true;if(op==='safeZone')state.safeZones=true;if(op==='space')state.style='space';
 $('#counter').textContent='🔧 '+state.used.size;msg('修改完成！<b>「'+o[1]+'」</b><br>'+o[2]+' 現在可以按 <b>▶ 玩玩看</b> 測試。');setHow(2);draw();}
function setHow(n){for(let i=1;i<=4;i++)$('#how'+i).classList.toggle('on',i===n)}
function setMode(play){running=play;$('#mode').textContent=play?'🎮 遊玩模式':'🛠 設計模式';$('#mode').className='mode'+(play?' play':'');$('#playBtn').textContent=play?'⏹ 停止測試':'▶ 玩玩看';$('#playBtn').className='btn '+(play?'stopbtn':'playbtn');document.querySelectorAll('.opt').forEach(b=>b.disabled=play);setHow(play?3:state.used.size?2:1)}
function resetPlayer(){const p=state.player;if(state.checkpoint){p.x=state.checkpoint.x;p.y=state.checkpoint.y}else{p.x=55;p.y=H/2}p.v=150;if(state.enemy){state.enemy.x=W-180;state.enemy.y=95}state.dash=0;}
function win(text){if(won)return;won=true;running=false;wins++;setMode(false);setHow(4);$('#toastText').textContent=text;$('#toast').classList.add('show');$('#nextBtn').hidden=false;$('#nextBtn').textContent=idx===levels.length-1?'查看學習成果 →':'前往第 '+levels[idx+1].no+' 關 →';msg('測試成功！你剛剛不是只把關卡變簡單，而是<b>改變規則後再驗證結果</b>。');}
function die(reason){state.dead++;resetPlayer();msg(reason+' 我把你送回起點。想想看，哪一個修改指令可以改善這個問題？');}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function roundRect(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function text(t,x,y,size=16,c='#22283b',align='left'){ctx.fillStyle=c;ctx.font='900 '+size+'px '+getComputedStyle(document.body).fontFamily;ctx.textAlign=align;ctx.fillText(t,x,y)}
function bg(){const s=state.style;let top='#bfe7ff',ground='#d7f2ff';if(s==='cyber'){top='#151a2a';ground='#252d46'}if(s==='space'){top='#090d1d';ground='#141b35'}if(s==='forest'){top='#c7efd0';ground='#8fd19e'}if(s==='ice'){top='#dff8ff';ground='#b9eaf7'}const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,ground);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);if(s==='space'){for(let i=0;i<70;i++)circle((i*97)%W,(i*53)%H,(i%3)+1,'rgba(255,255,255,.7)')}}
function player(){const p=state.player;circle(p.x,p.y,p.r,'#ff5a3c');roundRect(p.x-8,p.y-9,16,13,4,'#fff');circle(p.x-4,p.y-3,2,'#22283b');circle(p.x+4,p.y-3,2,'#22283b')}
function goal(open=true){const g=state.goal;roundRect(g.x-g.w/2,g.y-g.h/2,g.w,g.h,7,open?'#4cbb5e':'#7a879e');rect(g.x-4,g.y-g.h/2-18,8,g.h+18,'#22283b');text(open?'終點':'鎖定',g.x,g.y+5,12,'#fff','center')}
function collideCircleRect(p,r){const x=Math.max(r.x,Math.min(p.x,r.x+r.w)),y=Math.max(r.y,Math.min(p.y,r.y+r.h));return (p.x-x)**2+(p.y-y)**2<p.r**2}
function move(dt){if(!running||won)return;const p=state.player;let dx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),dy=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);let len=Math.hypot(dx,dy)||1;let speed=p.v;if(levels[idx].type==='chase'&&state.boost&&keys[' ']){speed=255;state.dash=Math.max(state.dash,0.2)}p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;p.x=Math.max(18,Math.min(W-18,p.x));p.y=Math.max(18,Math.min(H-18,p.y));state.trail.push([p.x,p.y]);if(state.trail.length>70)state.trail.shift()}
function drawMoving(dt){const p=state.player;rect(0,0,190,H,'#78c66d');rect(570,0,W-570,H,'#78c66d');rect(190,0,380,H,'#5db4e8');for(let y=0;y<H;y+=34)rect(190,y,380,3,'rgba(255,255,255,.28)');
 state.platformX+=state.platformDir*state.platformSpeed*dt;if(state.platformX<245||state.platformX>515){state.platformDir*=-1;state.platformX=Math.max(245,Math.min(515,state.platformX))}roundRect(state.platformX-state.platformW/2,H/2-42,state.platformW,84,12,state.style==='neon'?'#8b5cf6':'#ffc93c');text('移動平台',state.platformX,H/2+5,13,'#22283b','center');
 if(state.checkpoint){circle(state.checkpoint.x,state.checkpoint.y,21,'#fff');text('✓',state.checkpoint.x,state.checkpoint.y+7,19,'#3a9c4a','center')}
 const onLeft=p.x<195,onRight=p.x>565,onPlat=Math.abs(p.x-state.platformX)<state.platformW/2+8&&Math.abs(p.y-H/2)<55;if(running&&!onLeft&&!onRight&&!onPlat)die('你掉進天空缺口了。');goal(true);if(running&&p.x>state.goal.x-30)win('你成功利用移動平台到達終點。')}
function bridgeVisible(i){if(state.safe)return true;const phase=state.bridgeTogether?0:i*.42;const cycle=(state.t+phase)%(state.bridgeLong?2.8:2);return cycle<(state.bridgeLong?2.05:.95)}
function drawBridge(){rect(0,0,150,H,'#83ce74');rect(610,0,150,H,'#83ce74');rect(150,0,460,H,'#49a9de');const tiles=[];for(let i=0;i<6;i++){const r={x:160+i*74,y:H/2-37,w:60,h:74};tiles.push(r);if(bridgeVisible(i))roundRect(r.x,r.y,r.w,r.h,8,state.style==='ice'?'rgba(210,249,255,.88)':'#d8e0e7')}
 const p=state.player,onLand=p.x<152||p.x>608,onTile=tiles.some((r,i)=>bridgeVisible(i)&&collideCircleRect(p,r));if(running&&!onLand&&!onTile)die('橋面剛好消失了。');goal(true);if(running&&p.x>state.goal.x-30)win('你掌握了計時器節奏，安全通過消失橋。')}
function laserOn(i){return ((state.t+i*.35)%state.laserPeriod)<state.laserPeriod*.58}
function drawLaser(){state.player.y=Math.max(60,Math.min(H-60,state.player.y));rect(0,40,W,H-80,state.style==='cyber'?'#232b45':'#d7e3ee');const buttons=[{x:190,y:105,c:'#ef4444',n:'紅'},{x:360,y:355,c:'#3aa7e8',n:'藍'},{x:520,y:105,c:'#ffc93c',n:'黃'}];if(state.showHint){text('紅  →  藍  →  黃',W/2,44,18,state.style==='cyber'?'#fff':'#22283b','center')}
 buttons.forEach((b,i)=>{circle(b.x,b.y,20,b.c);text(b.n,b.x,b.y+5,13,'#fff','center');if(running&&Math.hypot(state.player.x-b.x,state.player.y-b.y)<34&&state.order.length===i){state.order.push(['red','blue','yellow'][i]);msg('條件 '+(i+1)+' 成立：已啟動<b>'+b.n+'色按鈕</b>。')}});
 [270,445,610].forEach((x,i)=>{if(i===2&&state.disabledLaser)return;const on=laserOn(i);if(on){rect(x,45,7,H-90,'#ff334f');ctx.shadowBlur=14;ctx.shadowColor='#ff334f';rect(x+10,45,3,H-90,'#ff8897');ctx.shadowBlur=0;if(running&&Math.abs(state.player.x-x)<14)die('你碰到雷射了。')}});
 goal(state.order.length===3);if(running&&state.player.x>state.goal.x-30&&state.order.length===3)win('三個條件按照正確順序成立，密碼門已開啟。')}
const walls=[{x:100,y:45,w:22,h:270},{x:100,y:315,w:180,h:22},{x:205,y:115,w:22,h:220},{x:205,y:95,w:190,h:22},{x:375,y:95,w:22,h:260},{x:375,y:335,w:200,h:22},{x:555,y:120,w:22,h:237},{x:555,y:100,w:115,h:22}];
function drawMaze(dt){rect(0,0,W,H,state.style==='forest'?'#9cd7a8':'#edf3f8');if(state.showTrail){[[60,230],[60,365],[305,365],[305,245],[470,245],[470,390],[670,390]].forEach((q,i)=>circle(q[0],q[1],6,i%2?'#ffc93c':'#ff9d31'))}walls.forEach(w=>roundRect(w.x,w.y,w.w,w.h,5,state.style==='forest'?'#417b4a':'#68758b'));
 const old={x:state.player.x,y:state.player.y};move(dt);if(walls.some(w=>collideCircleRect(state.player,w))){state.player.x=old.x;state.player.y=old.y}state.coinList.forEach((c,i)=>{if(!c[2]){circle(c[0],c[1],11,'#ffc93c');text('$',c[0],c[1]+5,13,'#7a5900','center');if(running&&Math.hypot(state.player.x-c[0],state.player.y-c[1])<26){c[2]=true;state.coins++;msg('金幣變數 +1，目前是 <b>'+state.coins+'</b>。')}}});
 const open=state.coins>=state.goalCoins;goal(open);text('金幣 '+state.coins+' / '+state.goalCoins,650,35,16,'#22283b','center');if(state.radar){const c=state.coinList.find(x=>!x[2]);if(c){const a=Math.atan2(c[1]-state.player.y,c[0]-state.player.x);text('雷達 '+arrowFor(a),650,64,14,'#1f83c0','center')}}if(running&&state.player.x>state.goal.x-30&&open)win('計數器達到解鎖條件，迷宮出口打開了。')}
function arrowFor(a){if(a>-Math.PI/4&&a<=Math.PI/4)return'→';if(a>Math.PI/4&&a<=3*Math.PI/4)return'↓';if(a<-Math.PI/4&&a>=-3*Math.PI/4)return'↑';return'←'}
function inSafe(p){return state.safeZones&&((p.x-250)**2+(p.y-105)**2<48**2||(p.x-455)**2+(p.y-350)**2<48**2)}
function drawChase(dt){rect(0,0,W,H,state.style==='space'?'rgba(28,38,75,.72)':'#dce9f1');if(state.safeZones){circle(250,105,48,'rgba(76,187,94,.35)');circle(455,350,48,'rgba(76,187,94,.35)');text('安全區',250,110,13,'#2c7d3a','center');text('安全區',455,355,13,'#2c7d3a','center')}
 if(!state.hasCore){circle(state.core.x,state.core.y,18,'#ffc93c');ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();text('核心',state.core.x,state.core.y+38,13,'#22283b','center');if(running&&Math.hypot(state.player.x-state.core.x,state.player.y-state.core.y)<34){state.hasCore=true;msg('你拿到<b>能源核心</b>了！出口條件成立，快逃出去。')}}
 if(running&&!inSafe(state.player)){const e=state.enemy,p=state.player,a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*state.enemySpeed*dt;e.y+=Math.sin(a)*state.enemySpeed*dt}circle(state.enemy.x,state.enemy.y,state.enemy.r,'#ef4444');text('👾',state.enemy.x,state.enemy.y+8,22,'#fff','center');if(running&&Math.hypot(state.player.x-state.enemy.x,state.player.y-state.enemy.y)<state.player.r+state.enemy.r)die('怪物追上你了。');goal(state.hasCore);if(running&&state.player.x>state.goal.x-30&&state.hasCore)win('你修改了 NPC 與玩家能力，完成終極追逐關卡。')}
function draw(){bg();const L=levels[idx];if(L.type==='moving')drawMoving(0);if(L.type==='bridge')drawBridge();if(L.type==='laser')drawLaser();if(L.type==='maze')drawMaze(0);if(L.type==='chase')drawChase(0);player()}
function frame(now){const dt=Math.min(.032,(now-last)/1000);last=now;state.t+=dt;if(running&&!won){bg();const t=levels[idx].type;if(t!=='maze')move(dt);if(t==='moving')drawMoving(dt);else if(t==='bridge')drawBridge();else if(t==='laser')drawLaser();else if(t==='maze')drawMaze(dt);else if(t==='chase')drawChase(dt);player()}else draw();requestAnimationFrame(frame)}
$('#playBtn').addEventListener('click',()=>{if(won)return;if(running){setMode(false);msg('已停止測試，可以繼續修改。')}else{setMode(true);msg('進入遊玩模式。實際跑一次，才知道設計是否真的可行。')}});
$('#resetBtn').addEventListener('click',()=>{resetPlayer();state.order=[];state.coins=0;if(state.coinList)state.coinList.forEach(c=>c[2]=false);state.hasCore=false;msg('位置與本次測試資料已重設，遊戲規則修改仍保留。')});
$('#nextBtn').addEventListener('click',()=>{if(idx<levels.length-1){idx++;initState();renderUI();window.scrollTo({top:0,behavior:'smooth'})}else{showResult()}});
$('#replayBtn').addEventListener('click',()=>{idx=0;totalCommands=0;wins=0;$('#result').hidden=true;$('#gameShell').hidden=false;$('#progress').hidden=false;$('#nextBtn').hidden=true;initState();renderUI();window.scrollTo({top:0,behavior:'smooth'})});
function showResult(){$('#gameShell').hidden=true;$('#progress').hidden=true;$('#nextBtn').hidden=true;$('#result').hidden=false;$('#statCommands').textContent=totalCommands;$('#statWins').textContent=wins;window.scrollTo({top:0,behavior:'smooth'})}
addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()},{passive:false});addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false});
initState();renderUI();requestAnimationFrame(frame);
})();

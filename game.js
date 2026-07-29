"use strict";
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const $ = function(id){ return document.getElementById(id); };
const mainEl=$('mainmenu'), levelsEl=$('levelsscr'), onlineEl=$('onlinescr'),
      editorEl=$('editorui'), pauseEl=$('pausescr'), winEl=$('winscr'),
      muteBtn=$('mute'), pauseBtn=$('pausebtn'), lvlList=$('levels'),
      upList=$('uplist'), toastEl=$('toast'), edNameIn=$('edname'),
      toolbarEl=$('toolbar'), edHintEl=$('edhint'),
      myEl=$('mylevelsscr'), myList=$('mylist'), edMusicSel=$('edmusic'),
      edObjColorIn=$('edobjcolor'), edMusOffIn=$('edmusoffset'),
      detailEl=$('detailscr'), iconsEl=$('iconscr'), iconTabs=$('icontabs'),
      iconGrid=$('icongrid');

const ICON_MODES = ['cube','ship','ball','wave'];
const ICON_LABELS = {cube:'CUBE', ship:'SHIP', ball:'BALL', wave:'WAVE'};
let iconMode = 'cube';
let selectedIcons = loadIcons();
function loadIcons(){
  const base={cube:0, ship:0, ball:0, wave:0};
  try{
    const saved=JSON.parse(localStorage.getItem('jd_icons')||'{}');
    ICON_MODES.forEach(function(m){ base[m]=Math.max(0, Math.min(9, saved[m]|0)); });
  }catch(e){}
  return base;
}
function saveIcons(){
  try{ localStorage.setItem('jd_icons', JSON.stringify(selectedIcons)); }catch(e){}
}
// ---------- sizing / physics ----------
let W=0, H=0, dpr=1, B=44, groundY=0;
let SPEED=0, GRAV=0, JUMPV=0, ROTS=0;
const CEIL_BLOCKS = 9;
function ceilingY(){ return groundY - CEIL_BLOCKS*B; }
function resize(){
  const oldB = B;
  dpr = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W*dpr; cv.height = H*dpr;
  cv.style.width = W+'px'; cv.style.height = H+'px';
  B = Math.max(24, Math.min(60, Math.round(H/15)));
  groundY = Math.round(H*0.74);
  SPEED = 0.158*B;
  GRAV  = 0.0205*B;
  JUMPV = 0.31*B;
  ROTS  = Math.PI / (2*JUMPV/GRAV);
  if(oldB && oldB !== B){ P.x *= B/oldB; edCamX *= B/oldB; }
  if(P.onGround && mode==='cube') P.y = groundY - B;
}

// ---------- levels ----------
// sp(gx,gy,flipped)  bl(gx,gy,w,h)  po(gx,'ship'|'cube')  spd(gx,tier)  orb(gx,gy,'y'|'p')
function makeLevel(name, diff, hue, track, endX, fn){
  const L = {name:name, diff:diff, hue:hue, track:track,
             spikes:[], blocks:[], portals:[], speeds:[], orbs:[], pads:[], decos:[], triggers:[], slopes:[], saws:[], starts:[], endX:endX};
  fn(
    function(gx, gy, fl){ L.spikes.push({gx:gx, gy:gy||0, r:fl?1:0, sz:0}); },
    function(gx, gy, w, h){ L.blocks.push({gx:gx, gy:gy, w:w, h:h}); },
    function(gx, m, gy){ L.portals.push({gx:gx, m:m, gy:gy||0}); },
    function(gx, t, gy){ L.speeds.push({gx:gx, t:t, gy:gy||0}); },
    function(gx, gy, k){ L.orbs.push({gx:gx, gy:gy, k:k}); },
    function(gx, gy, k, sz){ L.saws.push({gx:gx, gy:gy||0, k:k||0, sz:sz||0}); }
  );
  return L;
}
// speed changers: multiplier, arrow count, color; 0.5x points backwards
const SPDS=[
  {m:0.8, n:1, c:'255,216,61',  rev:true},  // 0.5x yellow
  {m:1.0, n:1, c:'70,164,255'},             // 1x blue
  {m:1.2, n:2, c:'77,255,98'},              // 2x green
  {m:1.5, n:3, c:'255,92,214'},             // 3x pink
  {m:1.8, n:4, c:'255,75,75'}               // 4x red
];
const LEVELS = [
makeLevel('FIRST STEPS','EASY',210,0,290,
function(sp,bl,po,spd,orb,saw){
  sp(18); sp(26); sp(34);
  sp(44); sp(45); sp(54); sp(55);
  sp(64); bl(67,0,2,1); sp(72);
  sp(82); sp(83); orb(83,2,'p');
  sp(92); bl(95,0,3,1); bl(99,0,3,2); bl(103,0,4,3);
  po(115,'ship');
  bl(125,0,2,2); bl(133,6,2,3); bl(141,0,2,3); bl(149,5,2,4);
  bl(157,0,2,2); bl(157,6,2,3);
  po(166,'cube');
  sp(178); sp(186); sp(196); sp(197); orb(196,2,'y'); sp(206);
  sp(214); sp(222);
  bl(230,0,1,1); sp(238);
  sp(246); sp(247);
  saw(256,0,0,0);
  sp(265); orb(272,2,'y'); sp(278);
  sp(285); sp(286); orb(285,2,'y');
}),
makeLevel('BLOCK PARTY','EASY',280,1,278,
function(sp,bl,po,spd,orb,saw){
  sp(15); sp(22); sp(29);
  sp(38); sp(39); sp(47); sp(48);
  sp(56); bl(58,0,6,1); sp(61,1); sp(70);
  sp(78); sp(79);
  sp(86); bl(88,0,3,1); bl(91,0,3,2); sp(100);
  spd(105,0);
  po(108,'ship');
  bl(116,0,2,3); bl(123,6,2,3); bl(130,0,2,4); bl(137,5,2,4);
  bl(144,0,2,2); bl(144,6,2,3); bl(151,0,2,4);
  po(159,'cube');
  spd(162,1);
  sp(168); sp(176); sp(177);
  bl(185,0,1,1); bl(190,0,1,1);
  sp(198); sp(199);
  sp(207); sp(208); sp(209); sp(210); sp(211); orb(209,2,'y');
  sp(219); sp(220);
  bl(228,0,1,1); sp(236);
  sp(244); sp(245);
  saw(254,0,0,0);
  sp(263); orb(269,2,'y'); sp(274);
}),
makeLevel('SPIKE STORM','NORMAL',170,2,320,
function(sp,bl,po,spd,orb,saw){
  sp(14); sp(21); sp(22);
  sp(30); sp(31); sp(32);
  sp(40); bl(46,0,5,1); sp(49,1); sp(57);
  sp(64); bl(66,0,3,1); bl(69,0,3,2); bl(72,0,3,3); sp(83);
  po(90,'ship');
  bl(97,0,2,4); bl(103,5,2,4); bl(109,0,2,5); bl(115,4,2,5);
  bl(121,0,2,3); bl(121,6,2,3);
  bl(128,5,2,4); bl(134,0,2,4);
  bl(140,0,2,3); bl(140,6,2,3);
  po(148,'cube');
  spd(150,2);
  sp(157); sp(158);
  bl(166,0,1,2);
  sp(174); sp(175); sp(176);
  sp(184); sp(185); sp(193); sp(200); sp(201);
  sp(207); sp(208); sp(209); sp(210); sp(211); sp(212); orb(209,2,'y');
  sp(220); sp(221);
  sp(230); bl(238,0,1,1); sp(247);
  saw(256,0,0,0);
  sp(265); sp(266);
  orb(274,2,'y'); sp(281); sp(290);
  sp(299); sp(307); sp(308); orb(307,2,'y');
}),
makeLevel('SKY BREAKER','HARD',30,9,300,
function(sp,bl,po,spd,orb,saw){
  sp(14); sp(21); sp(22); sp(23);
  sp(31); sp(38); sp(39);
  sp(46); bl(48,0,2,1); sp(52);
  sp(60); sp(61);
  po(68,'ship');
  bl(75,0,2,4); bl(81,5,2,4); bl(87,0,2,5);
  bl(93,0,2,3); bl(93,6,2,3);
  po(101,'cube');
  spd(104,2);
  sp(110); bl(117,0,6,1); sp(120,1); sp(128);
  sp(135); sp(136); sp(137);
  bl(145,0,1,2); sp(152);
  spd(156,1);
  po(159,'ship');
  bl(166,0,2,4); sp(167,4);
  bl(173,6,2,3); sp(173,5,true); sp(174,5,true);
  bl(180,0,2,5);
  bl(187,0,2,3); bl(187,6,2,3);
  bl(194,5,2,4);
  po(202,'cube');
  sp(211); sp(212);
  sp(220); sp(221); sp(222);
  sp(230); sp(231);
  sp(236); sp(237); sp(238); sp(239); sp(240); orb(238,2,'y');
  sp(248); sp(249);
  bl(257,0,1,1); sp(265);
  saw(274,0,0,0);
  sp(283); orb(289,2,'y'); sp(294); sp(295);
}),
makeLevel('FINAL GAUNTLET','INSANE',330,3,328,
function(sp,bl,po,spd,orb,saw){
  sp(12); sp(18); sp(19);
  sp(26); sp(27); sp(28);
  sp(35); sp(41); sp(42);
  bl(49,0,1,2); bl(54,0,1,1); bl(59,0,1,2);
  bl(66,0,8,1); sp(69,1); sp(80);
  sp(87); sp(88); sp(89);
  spd(93,0);
  po(96,'ship');
  bl(103,0,2,4); bl(110,5,2,4); bl(118,0,2,5);
  bl(126,0,2,3); bl(126,6,2,3);
  bl(133,6,2,3); sp(133,5,true); sp(134,5,true);
  bl(140,0,2,3); bl(140,6,2,3);
  po(148,'cube');
  spd(150,3);
  sp(156); sp(157); sp(158);
  sp(167); sp(168);
  bl(177,0,1,2);
  sp(188); sp(189); sp(190);
  sp(199); sp(200);
  spd(207,4);
  sp(213); sp(214); sp(215);
  sp(227); sp(228); sp(229); sp(230); sp(231); sp(232); sp(233); sp(234); sp(235);
  orb(231,2,'y');
  spd(242,2);
  sp(249); sp(250);
  sp(259); bl(267,0,1,1); sp(276);
  saw(285,0,0,0);
  sp(294); sp(295);
  orb(303,2,'y'); sp(310); sp(319); orb(317,2,'y');
}),
makeLevel('DEMON DAWN','EASY DEMON',25,5,349,
function(sp,bl,po,spd,orb,saw){
  sp(12); sp(18); sp(19);
  sp(25); sp(26); sp(27);
  bl(33,0,1,2); sp(40);
  bl(46,0,8,1); sp(50,1); sp(60); sp(61);
  sp(68); sp(69); sp(70);
  spd(75,2);
  sp(82); sp(83);
  sp(91); sp(92); sp(93);
  bl(101,0,1,2); sp(110); sp(111);
  po(118,'ship');
  bl(126,0,2,4); bl(134,5,2,4); bl(142,0,2,5);
  bl(150,0,2,3); bl(150,6,2,3);
  bl(158,6,2,3); sp(158,5,true); sp(159,5,true);
  bl(166,0,2,3); bl(166,6,2,3);
  po(174,'cube');
  spd(177,3);
  sp(185); sp(186); sp(187);
  sp(195); sp(196);
  bl(204,0,1,2);
  sp(212); sp(213); sp(214);
  sp(222);
  sp(230); sp(231); sp(232); sp(233); sp(234); sp(235); sp(236); sp(237);
  orb(233,2,'y');
  spd(244,2);
  sp(251); sp(252);
  sp(261); bl(269,0,1,1); sp(278);
  saw(287,0,0,0);
  sp(296); orb(302,2,'y'); sp(309); sp(318);
  sp(327); sp(336); sp(337); orb(336,2,'y');
}),
makeLevel('NIGHTMARE CIRCUIT','MEDIUM DEMON',285,8,348,
function(sp,bl,po,spd,orb,saw){
  sp(10); sp(16); sp(17);
  sp(23); sp(24); sp(25);
  bl(31,0,1,2); bl(36,0,1,2);
  sp(43); sp(44);
  bl(50,0,6,1); sp(53,1);
  sp(61); sp(62);
  sp(69); sp(70); sp(71);
  spd(76,0);
  sp(82); sp(87); sp(92);
  spd(97,2);
  sp(104); sp(105);
  sp(113); sp(114); sp(115);
  po(122,'ship');
  bl(130,0,2,5); bl(138,4,2,5); bl(147,0,2,5);
  bl(154,0,2,3); bl(154,6,2,3);
  bl(162,6,2,3); sp(162,5,true); sp(163,5,true);
  bl(170,0,2,5);
  bl(178,0,2,3); bl(178,6,2,3);
  po(186,'cube');
  spd(189,3);
  sp(197); sp(198); sp(199);
  bl(207,0,1,2);
  sp(215); sp(216); sp(217);
  sp(226); sp(227);
  spd(231,4);
  sp(237); sp(238); sp(239);
  sp(248); sp(249); sp(250); sp(251); sp(252); sp(253); sp(254); sp(255);
  sp(256); sp(257); sp(258);
  orb(252,2,'y');
  spd(265,2);
  sp(272); sp(273);
  sp(282); bl(290,0,1,1); sp(299);
  saw(308,0,0,0);
  sp(317); sp(318);
  orb(326,2,'y'); sp(333); sp(342); orb(340,2,'y');
}),
makeLevel('HELLGATE','HARD DEMON',0,11,364,
function(sp,bl,po,spd,orb,saw){
  sp(10); sp(15); sp(16);
  sp(22); sp(23); sp(24);
  bl(30,0,1,2); sp(36); sp(37);
  sp(44); sp(45); sp(46);
  bl(53,0,1,2); bl(58,0,1,2);
  sp(65); sp(66);
  sp(73); sp(74); sp(75);
  spd(80,2);
  sp(87); sp(88);
  sp(96); sp(97); sp(98);
  bl(106,0,1,2);
  sp(113); sp(114);
  po(121,'ship');
  bl(129,0,2,5);
  bl(137,5,2,4); sp(137,4,true); sp(138,4,true);
  bl(146,0,2,5);
  bl(154,0,2,3); bl(154,6,2,3);
  bl(162,6,2,3); sp(162,5,true); sp(163,5,true);
  bl(170,0,2,5);
  bl(178,0,2,3); bl(178,6,2,3);
  bl(184,0,2,3); bl(184,6,2,3);
  po(192,'cube');
  spd(195,4);
  sp(204); sp(205); sp(206);
  sp(217); sp(218);
  bl(227,0,1,2);
  sp(240); sp(241); sp(242);
  sp(250); sp(251); sp(252); sp(253); sp(254); sp(255); sp(256); sp(257);
  sp(258); sp(259); sp(260); sp(261); sp(262);
  orb(253,2,'y'); orb(258,4,'y');
  spd(269,2);
  sp(276); sp(277);
  sp(286); bl(294,0,1,1); sp(303);
  saw(312,0,0,0);
  sp(321); orb(327,2,'y'); sp(334); sp(343);
  sp(352); sp(353); sp(354); orb(353,2,'y');
}),
makeLevel('PHANTOM SURGE','INSANE DEMON',272,5,348,
function(sp,bl,po,spd,orb,saw){
  spd(7,2);                          // 2x throughout - jump arc ~9.5 cols
  // cube spike rhythm
  sp(14); sp(15);
  sp(25); sp(26);
  bl(35,0,1,2); sp(42);
  saw(51,0,0,0);                     // ground saw - jump it like a wide spike
  sp(62); sp(63);
  orb(72,2,'y'); sp(78); sp(79);     // orb hop over the spikes
  sp(88); sp(89);
  // ship corridor (gravity stays down)
  po(98,'ship');
  bl(106,0,2,4); bl(112,5,2,4);
  saw(118,4,2,1);                    // mid-corridor shuriken
  bl(124,0,2,3); bl(124,6,2,3);
  bl(131,5,2,4);
  // ball: alternate floor/ceiling. ENDS on a ceiling spike so a ceiling
  // camper dies, then a gravity portal forces normal gravity before the cube
  po(139,'ball');
  sp(152); sp(153);                  // floor spikes -> be on the ceiling
  sp(166,8,true); sp(167,8,true);    // ceiling spikes -> be on the floor
  sp(180); sp(181);                  // floor -> ceiling
  sp(194,8,true); sp(195,8,true);    // ceiling -> floor (you exit grounded)
  po(202,'gdown'); po(204,'cube');   // reset gravity, back to cube
  // dense cube finale
  sp(212); sp(213);
  saw(222,0,0,0);
  sp(233); sp(234);
  bl(242,0,1,2); sp(249);
  sp(258); sp(259); sp(260); orb(258,2,'y');
  sp(269); sp(270);
  saw(279,0,0,0);
  sp(288); sp(289);
  bl(297,0,1,1); sp(305);
  orb(313,2,'y'); sp(320); sp(329);
  sp(338); sp(339); sp(340); orb(338,2,'y');
}),
makeLevel('OBLIVION','EXTREME DEMON',350,11,380,
function(sp,bl,po,spd,orb,saw){
  spd(7,2);                          // 2x base, with one 3x burst later
  // cube intro
  sp(13); sp(14);
  sp(22); sp(23);
  saw(31,0,0,0);
  sp(43); sp(44);
  bl(53,0,1,2); sp(60);
  saw(69,0,0,1);
  sp(81); sp(82);
  orb(91,2,'p'); sp(97); sp(98);
  // ship corridor: gentle alternating floor/ceiling blocks (wide openings)
  po(107,'ship');
  bl(116,0,2,3);                     // low floor block - fly over it
  bl(124,6,2,3);                     // high ceiling block - fly under it
  saw(132,4,2,2);                    // tiny mid saw - small weave
  bl(140,0,2,3);                     // floor block
  bl(147,6,2,3);                     // ceiling block
  // ball: ends on ceiling spikes + gravity reset (anti ceiling-cheese)
  po(154,'ball');
  sp(167); sp(168);                  // floor -> ceiling
  sp(181,8,true); sp(182,8,true);    // ceiling -> floor
  sp(195); sp(196);                  // floor -> ceiling
  sp(209,8,true); sp(210,8,true);    // ceiling -> floor (exit grounded)
  po(217,'gdown'); po(219,'cube');   // force gravity down, back to cube
  // 3x burst - single spikes spaced past the ~14 col jump arc
  spd(221,3);
  sp(231);
  sp(249);
  sp(267);
  spd(271,2);                        // back to 2x
  // wave - spikes only block the top/bottom, cruise the middle band
  po(279,'wave');
  sp(287); sp(288);
  sp(300,8,true); sp(301,8,true);
  saw(311,4,2,2);
  sp(322); sp(323);
  // back to cube (gravity already normal -> just falls to the floor)
  po(333,'cube');
  sp(341); sp(342);
  saw(350,0,0,0);
  sp(358); sp(359);
  sp(367); sp(368); sp(369); sp(370); sp(371); orb(369,2,'y');
})
];
// auto-decorate the campaign levels with background deco objects
(function(){
  LEVELS.forEach(function(L){
    let s=((L.hue|0)*2654435761 + L.endX*97)>>>0;
    function rnd(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }
    const occ={};
    L.spikes.forEach(function(o){ if(!o.gy) occ[o.gx]=1; });
    L.blocks.forEach(function(o){
      if(!o.gy) for(let g=o.gx; g<o.gx+o.w; g++) occ[g]=1;
    });
    for(let gx=8; gx<L.endX-4; gx+=3+((rnd()*5)|0)){
      if(occ[gx]) continue;
      L.decos.push({gx:gx, gy:0, k:[0,0,3,5,3][(rnd()*5)|0]});
    }
    for(let i=0;i<L.portals.length;i++){
      const p=L.portals[i];
      L.decos.push({gx:p.gx, gy:4, k:2});
      if(p.m==='ship'){
        const end=(i+1<L.portals.length)? L.portals[i+1].gx : L.endX;
        for(let gx=p.gx+3; gx<end-1; gx+=4+((rnd()*3)|0)){
          L.decos.push({gx:gx, gy:8, k:1});
          if(rnd()<0.5) L.decos.push({gx:gx, gy:7, k:1});
        }
      }
    }
  });
})();

// ---------- state ----------
const P = {x:0, y:0, vy:0, rot:0, onGround:true, dead:false};
// states: main | levels | online | edit | play | win
let state='main', held=false, paused=false, attempts=1, deadT=0, camX=0;
let curLi=0, curL=LEVELS[0], mode='cube', speedMult=1, shipAnim=0;
let objColorCur='255,255,255'; // outline colour for blocks/spikes/slopes (per level)
let portalHit=[], speedHit=[];
let particles=[], shake=0, ftick=0, deathX=0, deathY=0;
let orbUsed=[], pressBuf=0, padCool=[];
let gdir=1, flipQueued=false; // ball gravity direction + tap-to-flip edge
let gravSwing=0; // brief low-gravity "swing" after a gravity-portal/blue-pad flip
function snapGravity(newGdir, keepMomentum, swing){
  if(newGdir===gdir) return;
  gdir=newGdir;
  P.vy = keepMomentum===false ? 0 : -P.vy;
  if(swing) gravSwing=8;   // gravity portals only: float a moment before momentum builds
  P.onGround=false;
  if(mode==='cube') P.rot=Math.round(P.rot/(Math.PI/2))*(Math.PI/2);
  else if(mode==='wave') P.rot=(held?-1:1)*gdir*Math.PI/4;
  else if(mode==='ship') P.rot=Math.atan2(P.vy, SPEED*speedMult*2.5);
}
function toggleGravity(){ snapGravity(-gdir); }
// group-move triggers: live offset (blocks) per group id, plus color-trigger bg hue
let groupOff={}, groupTarget={}, trigFired=[];
let bgHueCur=210, bgHueTarget=210;
// effective grid position = base position + its group's live move offset
function egx(o){ const f=o.g&&groupOff[o.g]; return f?o.gx+f.x:o.gx; }
function egy(o){ const f=o.g&&groupOff[o.g]; return (o.gy||0)+(f?f.y:0); }
let playCtx={type:'campaign', li:0};

function playerScreenX(){ return Math.min(W*0.3, 300); }
function reset(){
  P.x=0; P.y=groundY-B; P.vy=0; P.rot=0; P.onGround=true; P.dead=false;
  mode='cube'; speedMult=1; shipAnim=0; deadT=0; particles.length=0;
  gdir=1; flipQueued=false; gravSwing=0;
  groupOff={}; groupTarget={}; bgHueCur=bgHueTarget=curL.hue;
  trigFired = new Array((curL.triggers||[]).length).fill(false);
  portalHit = new Array(curL.portals.length).fill(false);
  speedHit = new Array((curL.speeds||[]).length).fill(false);
  orbUsed = new Array((curL.orbs||[]).length).fill(false); pressBuf=0;
  padCool = new Array((curL.pads||[]).length).fill(0);
  if(state==='play' && playCtx.type==='test' && spawnStart) applyStartPos(spawnStart);
  camX = P.x - playerScreenX();
  restartMusic();
}
// spawn at a start-position marker: jump the player there and fast-forward the
// gamemode / gravity / speed / triggers so mid-level testing starts in the right state
function applyStartPos(s){
  const sx=s.gx;
  P.x=sx*B; P.y=groundY-(s.gy+1)*B; P.vy=0; P.onGround=false;
  (curL.portals||[]).forEach(function(p,i){
    if(p.gx < sx){
      if(p.m==='gdown') gdir=1; else if(p.m==='gup') gdir=-1; else mode=p.m;
      portalHit[i]=true;
    }
  });
  (curL.speeds||[]).forEach(function(v,i){ if(v.gx < sx){ speedMult=SPDS[v.t].m; speedHit[i]=true; } });
  (curL.triggers||[]).forEach(function(tr,i){
    if(tr.gx <= sx){
      trigFired[i]=true;
      if(tr.type==='color'){ bgHueCur=bgHueTarget=((tr.hue||0)%360+360)%360; }
      else if(tr.g){
        if(!groupTarget[tr.g]) groupTarget[tr.g]={x:0,y:0};
        groupTarget[tr.g].x+=(tr.dx||0); groupTarget[tr.g].y+=(tr.dy||0);
        groupOff[tr.g]={x:groupTarget[tr.g].x, y:groupTarget[tr.g].y};   // snap moved groups
      }
    }
  });
}
function pctNow(){
  return Math.max(0, Math.min(100, Math.floor(P.x/(curL.endX*B)*100)));
}
function saveBest(i, pct){
  try{
    const k='gdc_best_'+i;
    if(pct > +(localStorage.getItem(k)||0)) localStorage.setItem(k, pct);
  }catch(e){}
}
function getBest(i){
  try{ return +(localStorage.getItem('gdc_best_'+i)||0); }catch(e){ return 0; }
}
function toast(msg){
  toastEl.textContent=msg; toastEl.style.opacity=1; toastEl.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t=setTimeout(function(){ toastEl.style.opacity=0; }, 2200);
}

// ---------- audio ----------
let AC=null, master=null, muted=false, noiseBuf=null, nextT=0, stepI=0;
let kickTimes=[], pulse=0;
let EIcur=60/141/2, TR=null, curTrack=0;
let songAudio=null; // currently-playing <audio> element for 'file' tracks
let songOffset=0;   // per-level start offset (seconds) for sampled songs

// 12 built-in tracks. prog = root note per bar (8 bars, loops).
// kick/snare/hat = 8 eighth-note steps per bar. bass/lead pat = semitone
// offsets from the bar root (null = rest), any length, loops over steps.
const TRACKS=[
{name:'DASHER',bpm:141,prog:[55,55,43.65,43.65,65.41,65.41,49,49],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,0,0,0,0,0,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:750,pat:[0,0,0,12,0,0,0,12]},
 lead:{wave:'square',gain:0.05,oct:4,pat:[0,null,7,null,12,null,7,null]}},
{name:'SKYLINE',bpm:122,prog:[41.2,41.2,49,49,55,55,43.65,49],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'sawtooth',cut:500,pat:[null,0,null,0,null,0,null,0]},
 lead:{wave:'triangle',gain:0.07,oct:2,pat:[0,3,7,10,12,10,7,3,0,3,7,10,15,12,10,7]}},
{name:'PULSE DRIVE',bpm:150,prog:[36.71,36.71,36.71,36.71,43.65,43.65,32.7,32.7],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,0,0,0,0,1,0],hat:[0,1,0,1,0,1,1,1],
 bass:{wave:'sawtooth',cut:600,pat:[0,null,0,0,null,0,0,null,0,null,0,0,null,0,3,5]},
 lead:{wave:'sawtooth',gain:0.04,oct:4,pat:[null,null,12,null,null,7,null,null]}},
{name:'NEON RUSH',bpm:160,prog:[55,55,58.27,58.27,49,49,43.65,43.65],
 kick:[1,0,1,0,1,0,1,1],snare:[0,0,1,0,0,0,1,0],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'sawtooth',cut:900,pat:[0,12,0,12,0,12,0,12]},
 lead:{wave:'square',gain:0.05,oct:4,pat:[0,3,7,12,7,3,0,3,0,3,7,12,15,12,7,3]}},
{name:'MOONLIGHT',bpm:100,prog:[43.65,43.65,41.2,41.2,38.89,38.89,43.65,49],
 kick:[1,0,0,0,0,0,1,0],snare:[0,0,0,0,1,0,0,0],hat:[0,0,1,0,0,0,1,0],
 bass:{wave:'triangle',cut:400,pat:[0,null,null,null,0,null,null,null]},
 lead:{wave:'triangle',gain:0.08,oct:2,pat:[12,null,10,null,7,null,3,null,5,null,7,null,3,null,0,null]}},
{name:'STORMCORE',bpm:170,prog:[36.71,36.71,43.65,43.65,36.71,36.71,46.25,43.65],
 kick:[1,1,0,1,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:650,pat:[0,0,null,0,0,null,0,0]},
 lead:{wave:'square',gain:0.045,oct:4,pat:[null,12,null,null,10,null,7,null,null,12,null,15,null,12,null,7]}},
{name:'GLACIER',bpm:90,prog:[32.7,32.7,36.71,36.71,29.14,29.14,32.7,32.7],
 kick:[1,0,0,0,1,0,0,0],snare:[0,0,0,0,0,0,0,0],hat:[0,0,0,1,0,0,0,1],
 bass:{wave:'sine',cut:300,pat:[0,null,null,null,null,null,null,null]},
 lead:{wave:'triangle',gain:0.08,oct:2,pat:[0,null,null,7,null,null,12,null,null,10,null,7,null,3,null,null]}},
{name:'VOLTAGE',bpm:152,prog:[41.2,41.2,41.2,43.65,49,49,43.65,38.89],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'square',cut:1200,pat:[0,null,0,null,3,null,5,null]},
 lead:{wave:'sawtooth',gain:0.04,oct:4,pat:[12,null,null,12,null,10,null,7]}},
{name:'ABYSS',bpm:132,prog:[30.87,30.87,30.87,30.87,32.7,32.7,29.14,29.14],
 kick:[1,0,0,1,0,0,1,0],snare:[0,0,0,0,1,0,0,0],hat:[0,1,1,0,1,1,0,1],
 bass:{wave:'sawtooth',cut:500,pat:[0,0,12,0,0,10,0,12]},
 lead:{wave:'triangle',gain:0.05,oct:4,pat:[null,null,null,null,6,null,null,null]}},
{name:'SUNRISE',bpm:138,prog:[65.41,65.41,43.65,43.65,49,49,55,55],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:800,pat:[0,null,0,0,null,0,0,null]},
 lead:{wave:'square',gain:0.05,oct:4,pat:[0,4,7,12,7,4,0,null,4,7,12,16,12,7,4,null]}},
{name:'CIRCUITS',bpm:145,prog:[55,55,49,49,58.27,58.27,65.41,49],
 kick:[1,0,1,0,1,0,1,0],snare:[0,0,1,0,0,0,1,1],hat:[1,1,1,1,1,1,1,1],
 bass:{wave:'square',cut:2000,pat:[0,12,0,12,0,12,0,12]},
 lead:{wave:'square',gain:0.055,oct:4,pat:[0,7,12,7,15,12,7,0,3,7,12,7,15,12,10,7]}},
{name:'FINAL BOSS',bpm:175,prog:[36.71,36.71,38.89,38.89,36.71,36.71,34.65,34.65],
 kick:[1,0,1,1,1,0,1,1],snare:[0,0,1,0,0,0,1,0],hat:[0,1,0,1,0,1,0,1],
 bass:{wave:'sawtooth',cut:700,pat:[0,0,0,12,0,0,10,12]},
 lead:{wave:'sawtooth',gain:0.05,oct:4,pat:[12,null,12,null,15,null,19,null]}},
// real audio track: 'file' marks it as a sampled song. The synth scheduler
// skips it and an <audio> element loops the mp3 instead. vol = its loudness
// (0..1) - kept low so it sits a bit quieter than full blast.
{name:'AT THE SPEED OF LIGHT',file:'at-the-speed-of-light.mp3',vol:0.35,bpm:128}
];
// --- sampled (mp3) song playback for 'file' tracks ---
function songFor(tr){
  if(!tr || !tr.file) return null;
  if(!tr._audio){
    const a=new Audio(tr.file);
    a.loop=true; a.preload='auto';
    tr._audio=a;
  }
  return tr._audio;
}
function stopSong(){
  if(songAudio){ try{ songAudio.pause(); }catch(e){} songAudio=null; }
}
function startSong(tr, restart){
  const a=songFor(tr); if(!a) return;
  if(songAudio && songAudio!==a) stopSong();
  songAudio=a;
  a.volume=(tr.vol!=null?tr.vol:0.4);
  a.muted=muted;
  if(restart){ try{ a.currentTime=Math.max(0,songOffset||0); }catch(e){} }
  a.play().catch(function(){});
}
function setTrack(i){
  curTrack=Math.max(0,Math.min(TRACKS.length-1,i|0));
  TR=TRACKS[curTrack];
  EIcur=60/(TR.bpm||128)/2; stepI=0;
  if(AC) nextT=AC.currentTime+0.05;
  if(TR.file){ if(AC) startSong(TR, true); }
  else stopSong();
}
function restartMusic(){
  stepI = 0; kickTimes.length=0;
  if(AC) nextT = AC.currentTime + 0.12;
  if(TR && TR.file) startSong(TR, true);
}
function initAudio(){
  if(AC){
    if(AC.state==='suspended' && !paused) AC.resume();
    if(TR && TR.file && !paused) startSong(TR, false);
    return;
  }
  try{
    AC = new (window.AudioContext||window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = muted?0:0.45;
    master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    nextT = AC.currentTime + 0.1;
    setInterval(function(){
      if(AC.state!=='running') return;
      while(nextT < AC.currentTime + 0.18){
        playStep(stepI, nextT);
        nextT += EIcur; stepI = (stepI+1)%64;
      }
    }, 60);
    if(TR && TR.file) startSong(TR, false);
  }catch(e){}
}
function env(t,a,peak,dur){
  const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(peak,t+a);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  g.connect(master); return g;
}
function kick(t){
  const o=AC.createOscillator();
  o.frequency.setValueAtTime(160,t);
  o.frequency.exponentialRampToValueAtTime(45,t+0.1);
  o.connect(env(t,0.002,0.9,0.13)); o.start(t); o.stop(t+0.15);
  kickTimes.push(t); if(kickTimes.length>20) kickTimes.shift();
}
function hat(t){
  const s=AC.createBufferSource(); s.buffer=noiseBuf;
  const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=6500;
  s.connect(f); f.connect(env(t,0.001,0.12,0.05)); s.start(t); s.stop(t+0.06);
}
function snare(t){
  const s=AC.createBufferSource(); s.buffer=noiseBuf;
  const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800; f.Q.value=0.8;
  s.connect(f); f.connect(env(t,0.002,0.3,0.12)); s.start(t); s.stop(t+0.14);
  const o=AC.createOscillator(); o.type='triangle';
  o.frequency.setValueAtTime(190,t);
  o.frequency.exponentialRampToValueAtTime(120,t+0.08);
  o.connect(env(t,0.002,0.2,0.09)); o.start(t); o.stop(t+0.1);
}
function bassN(fr,t,wave,cut){
  const o=AC.createOscillator(); o.type=wave; o.frequency.value=fr;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=cut;
  o.connect(f); f.connect(env(t,0.005,0.3,EIcur*0.92)); o.start(t); o.stop(t+EIcur);
}
function leadN(fr,t,wave,gain){
  const o=AC.createOscillator(); o.type=wave; o.frequency.value=fr;
  o.connect(env(t,0.004,gain,EIcur*0.85)); o.start(t); o.stop(t+EIcur);
}
function playStep(i,t){
  if(!TR || TR.file) return;
  const bar=(i>>3)&7, ei=i&7, root=TR.prog[bar];
  if(TR.kick[ei]) kick(t);
  if(TR.snare[ei]) snare(t);
  if(TR.hat[ei]) hat(t);
  const bp=TR.bass.pat, bo=bp[i%bp.length];
  if(bo!==null) bassN(root*Math.pow(2,bo/12), t, TR.bass.wave, TR.bass.cut);
  const lp=TR.lead.pat, lo=lp[i%lp.length];
  if(lo!==null) leadN(root*TR.lead.oct*Math.pow(2,lo/12), t, TR.lead.wave, TR.lead.gain);
}
function deathSfx(){
  if(!AC || AC.state!=='running') return; const t=AC.currentTime;
  const s=AC.createBufferSource(); s.buffer=noiseBuf;
  const f=AC.createBiquadFilter(); f.type='lowpass';
  f.frequency.setValueAtTime(3000,t);
  f.frequency.exponentialRampToValueAtTime(200,t+0.3);
  s.connect(f); f.connect(env(t,0.002,0.5,0.32)); s.start(t); s.stop(t+0.35);
  const o=AC.createOscillator();
  o.frequency.setValueAtTime(220,t);
  o.frequency.exponentialRampToValueAtTime(40,t+0.3);
  o.connect(env(t,0.002,0.4,0.3)); o.start(t); o.stop(t+0.32);
}
function orbSfx(){
  if(!AC || AC.state!=='running') return; const t=AC.currentTime;
  const o=AC.createOscillator(); o.type='triangle';
  o.frequency.setValueAtTime(600,t);
  o.frequency.exponentialRampToValueAtTime(1200,t+0.08);
  o.connect(env(t,0.004,0.25,0.12)); o.start(t); o.stop(t+0.14);
}
function winSfx(){
  if(!AC || AC.state!=='running') return; const t=AC.currentTime;
  [523.25,659.25,783.99,1046.5].forEach(function(f,i){
    const o=AC.createOscillator(); o.type='square'; o.frequency.value=f;
    o.connect(env(t+i*0.12,0.01,0.12,0.3));
    o.start(t+i*0.12); o.stop(t+i*0.12+0.32);
  });
}
function toggleMute(){
  muted=!muted;
  if(master) master.gain.value = muted?0:0.45;
  if(songAudio) songAudio.muted = muted;
  muteBtn.innerHTML = muted ? '&#128263;' : '&#128266;';
}

// ---------- custom level pack/unpack & uploads ----------
function hashStr(s){
  let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  return h;
}
function packLevel(d){
  return {n:d.name, m:(d.m|0), mo:(+d.mo||0), oc:(d.oc||'255,255,255'),
    s:d.spikes.map(function(x){return [x.gx,x.gy,x.r|0,x.sz|0,x.g|0];}),
    b:d.blocks.map(function(x){return [x.gx,x.gy,x.w,x.h,x.g|0,x.t|0];}),
    pd:(d.pads||[]).map(function(x){return [x.gx,x.gy,(x.k==='p'?1:x.k==='b'?2:0),x.r|0,x.g|0];}),
    st:(d.starts||[]).map(function(x){return [x.gx,x.gy|0];}),
    p:d.portals.map(function(x){return [x.gx,(x.m==='ship'?1:x.m==='ball'?2:x.m==='wave'?3:x.m==='gdown'?4:x.m==='gup'?5:x.m==='ufo'?6:0),x.gy|0,x.r|0,x.g|0];}),
    v:d.speeds.map(function(x){return [x.gx,x.t,x.gy|0,x.r|0,x.g|0];}),
    o:d.orbs.map(function(x){return [x.gx,x.gy,(x.k==='p'?1:x.k==='b'?2:0),x.g|0];}),
    e:(d.decos||[]).map(function(x){return [x.gx,x.gy,x.k,x.r|0,x.g|0,(x.z!=null?x.z:2)|0];}),
    sl:(d.slopes||[]).map(function(x){return [x.gx,x.gy,(x.o!=null?x.o:(x.dir||0))|0,x.g|0];}),
    sw:(d.saws||[]).map(function(x){return [x.gx,x.gy,x.k|0,x.sz|0,x.g|0];}),
    tg:(d.triggers||[]).map(function(x){return x.type==='color'
        ? [1,x.gx,x.gy|0,(x.hue|0)]
        : [0,x.gx,x.gy|0,(x.g|0),(x.dx||0),(x.dy||0)];})};
}
function unpackLevel(c){
  return {name:(''+(c.n||'CUSTOM')).slice(0,20), m:(+c.m||0), mo:(+c.mo||0), oc:(c.oc||'255,255,255'),
    spikes:(c.s||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,r:(+a[2]||0)&3,sz:(+a[3]||0)&3,g:+a[4]||0};}),
    blocks:(c.b||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,w:+a[2]||1,h:+a[3]||1,g:+a[4]||0,t:(+a[5]||0)};}),
    pads:(c.pd||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:(['y','p','b'][+a[2]||0]||'y'),r:(+a[3]||0)&3,g:+a[4]||0};}),
    starts:(c.st||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0};}),
    portals:(c.p||[]).map(function(a){return {gx:+a[0],m:(['cube','ship','ball','wave','gdown','gup','ufo'][+a[1]]||'cube'),gy:+a[2]||0,r:(+a[3]||0)&3,g:+a[4]||0};}),
    speeds:(c.v||[]).map(function(a){return {gx:+a[0],t:Math.min(4,Math.max(0,(+a[1]||0)|0)),gy:+a[2]||0,r:(+a[3]||0)&3,g:+a[4]||0};}),
    orbs:(c.o||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:(['y','p','b'][+a[2]||0]||'y'),g:+a[3]||0};}),
    decos:(c.e||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:Math.min(11,Math.max(0,(+a[2]||0)|0)),r:(+a[3]||0)&3,g:+a[4]||0,z:(a[5]!=null?Math.min(10,Math.max(0,(+a[5]||0)|0)):2)};}),
    slopes:(c.sl||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,o:(+a[2]||0)&3,g:+a[3]||0};}),
    saws:(c.sw||[]).map(function(a){return {gx:+a[0],gy:+a[1]||0,k:Math.min(2,Math.max(0,(+a[2]||0)|0)),sz:Math.min(2,Math.max(0,(+a[3]||0)|0)),g:+a[4]||0};}),
    triggers:(c.tg||[]).map(function(a){return (+a[0]===1)
        ? {type:'color',gx:+a[1],gy:+a[2]||0,hue:(+a[3]||0)}
        : {type:'move',gx:+a[1],gy:+a[2]||0,g:+a[3]||0,dx:+a[4]||0,dy:+a[5]||0};})};
}
function levelCode(d){
  return 'JD1.'+btoa(unescape(encodeURIComponent(JSON.stringify(packLevel(d)))));
}
function decodeLevel(code){
  code=(code||'').trim();
  if(code.indexOf('JD1.')!==0) return null;
  try{
    return unpackLevel(JSON.parse(decodeURIComponent(escape(atob(code.slice(4))))));
  }catch(e){ return null; }
}
function maxGx(d){
  let m=20;
  d.spikes.forEach(function(o){ if(o.gx>m)m=o.gx; });
  d.blocks.forEach(function(o){ if(o.gx+o.w>m)m=o.gx+o.w; });
  d.portals.forEach(function(o){ if(o.gx>m)m=o.gx; });
  d.speeds.forEach(function(o){ if(o.gx>m)m=o.gx; });
  d.orbs.forEach(function(o){ if(o.gx>m)m=o.gx; });
  (d.pads||[]).forEach(function(o){ if(o.gx>m)m=o.gx; });
  (d.decos||[]).forEach(function(o){ if(o.gx>m)m=o.gx; });
  (d.triggers||[]).forEach(function(o){ if(o.gx>m)m=o.gx; });
  (d.slopes||[]).forEach(function(o){ if(o.gx>m)m=o.gx; });
  (d.saws||[]).forEach(function(o){ if(o.gx>m)m=o.gx; });
  return m;
}
function objCount(d){
  return d.spikes.length+d.blocks.length+d.portals.length+d.speeds.length
    +d.orbs.length+(d.pads?d.pads.length:0)+(d.triggers?d.triggers.length:0)+(d.slopes?d.slopes.length:0)
    +(d.saws?d.saws.length:0);
}
function prepCustom(d){
  return {name:d.name||'CUSTOM', diff:'CUSTOM', hue:hashStr(d.name||'x')%360,
    track:(d.m|0), mo:(+d.mo||0), oc:(d.oc||'255,255,255'),
    spikes:d.spikes, blocks:d.blocks,
    portals:d.portals.slice().sort(function(a,b){return a.gx-b.gx;}),
    speeds:d.speeds.slice().sort(function(a,b){return a.gx-b.gx;}),
    orbs:d.orbs, pads:d.pads||[], decos:d.decos||[], triggers:(d.triggers||[]).slice(),
    slopes:d.slopes||[], saws:d.saws||[], starts:d.starts||[], endX:maxGx(d)+10};
}
function getUploads(){
  try{ return JSON.parse(localStorage.getItem('gdc_uploads')||'[]'); }catch(e){ return []; }
}
function setUploads(u){
  try{ localStorage.setItem('gdc_uploads', JSON.stringify(u)); }catch(e){}
}
// per-device level meta (ratings + likes): { levelId: {stars,diff,liked} }
// stars 1-10 map to difficulty (GD style): 2 easy, 3 normal, 4-5 hard,
// 6-7 harder, 8-9 insane, 10 demon. diff is an index into DIFFS (-1 unrated).
const DIFFS=['EASY','NORMAL','HARD','HARDER','INSANE','EASY DEMON','MEDIUM DEMON','HARD DEMON','INSANE DEMON','EXTREME DEMON'];
function starToDiff(st){
  if(st>=10) return 5;   // demon (default easy demon; can be changed to medium/hard)
  if(st>=8)  return 4;   // insane
  if(st>=6)  return 3;   // harder
  if(st>=4)  return 2;   // hard
  if(st>=3)  return 1;   // normal
  return 0;              // easy
}
function getRatings(){
  try{ return JSON.parse(localStorage.getItem('gdc_ratings')||'{}'); }catch(e){ return {}; }
}
function getMeta(id){
  const r=getRatings()[id]||{};
  return {stars:r.stars||0, diff:(typeof r.diff==='number'?r.diff:-1), liked:!!r.liked};
}
function setMeta(id,m){
  const all=getRatings();
  all[id]={stars:m.stars||0, diff:(typeof m.diff==='number'?m.diff:-1), liked:!!m.liked};
  try{ localStorage.setItem('gdc_ratings', JSON.stringify(all)); }catch(e){}
}
function levelBaseLikes(e){ return e.likes||0; }
function getMyLevels(){
  try{ return JSON.parse(localStorage.getItem('gdc_mylevels')||'[]'); }catch(e){ return []; }
}
function setMyLevels(l){
  try{ localStorage.setItem('gdc_mylevels', JSON.stringify(l)); }catch(e){}
}
// migrate the old single editor draft into the My Levels library
(function(){
  try{
    const raw=localStorage.getItem('gdc_draft');
    if(raw){
      const c=JSON.parse(raw);
      const l=getMyLevels();
      l.unshift({id:'draft0', name:(''+(c.n||'UNNAMED')).slice(0,20), d:c});
      setMyLevels(l);
      localStorage.removeItem('gdc_draft');
    }
  }catch(e){}
})();
// built-in community levels: always present in the uploaded list
const BUILTIN_UPLOADS=(function(){
  function mk(name, m, fn){
    const d={name:name, m:m, spikes:[], blocks:[], portals:[], speeds:[], orbs:[], decos:[]};
    fn(function(gx,gy,fl){ d.spikes.push({gx:gx,gy:gy||0,r:fl?1:0,sz:0}); },
       function(gx,gy,w,h){ d.blocks.push({gx:gx,gy:gy,w:w,h:h}); },
       function(gx,mm,gy){ d.portals.push({gx:gx,m:mm,gy:gy||0}); },
       function(gx,t,gy){ d.speeds.push({gx:gx,t:t,gy:gy||0}); },
       function(gx,gy,k){ d.orbs.push({gx:gx,gy:gy,k:k}); },
       function(gx,gy,k){ d.decos.push({gx:gx,gy:gy,k:k}); });
    return {id:'builtin_'+name.replace(/\s/g,'_'), name:name, builtin:true, d:packLevel(d)};
  }
  return [
  mk('STARTER ROAD',1,function(sp,bl,po,spd,orb,dec){
    sp(10); sp(17); sp(24); sp(31); sp(32);
    bl(38,0,2,1); sp(44);
    sp(52); sp(53); sp(54); sp(55); orb(53,2,'y');
    sp(63); bl(69,0,3,1); sp(76);
    dec(14,0,3); dec(28,0,0); dec(48,0,5); dec(60,0,3); dec(72,0,2);
  }),
  mk('ORBITAL',10,function(sp,bl,po,spd,orb,dec){
    sp(12); sp(13);
    sp(20); sp(21); sp(22); sp(23); orb(21,2,'y');
    sp(30); sp(31); sp(32); sp(33); orb(31,2,'y');
    spd(38,2);
    sp(45); sp(46); sp(47); sp(48); sp(49); sp(50); orb(47,2,'y');
    sp(56); sp(57); sp(58); sp(59); sp(60); sp(61); orb(58,2,'y');
    spd(64,1);
    sp(70); sp(71); sp(72); sp(73); orb(71,2,'y');
    dec(17,0,2); dec(27,0,2); dec(42,0,4); dec(53,0,2); dec(67,0,3);
  }),
  mk('WIND TUNNEL',2,function(sp,bl,po,spd,orb,dec){
    sp(6);
    po(10,'ship');
    bl(18,0,2,3); bl(26,5,2,4); bl(34,0,2,4); bl(42,6,2,3);
    bl(50,0,2,3); bl(50,6,2,3);
    po(58,'cube');
    sp(66); sp(72); sp(73);
    dec(22,8,1); dec(30,8,1); dec(38,8,1); dec(46,8,1); dec(14,0,3); dec(62,0,5);
  }),
  mk('GRAVITY WELL',6,function(sp,bl,po,spd,orb,dec){
    sp(6);
    po(11,'ball');                       // tap to flip gravity here on
    sp(22); sp(23);                      // dodge floor spikes (flip up)
    sp(34,8,true); sp(35,8,true);        // dodge ceiling spikes (flip down)
    sp(46); sp(47);
    sp(58,8,true); sp(59,8,true);
    sp(70); sp(71);
    po(80,'cube');
    sp(88); sp(94); sp(95);
    dec(16,4,2); dec(40,4,2); dec(64,4,2);
  })];
})();
// seed each built-in level with a base like count (local, this device)
[160,95,240,72].forEach(function(n,i){ if(BUILTIN_UPLOADS[i]) BUILTIN_UPLOADS[i].likes=n; });

// ---------- screens ----------
function hideAllScreens(){
  [mainEl,levelsEl,onlineEl,myEl,detailEl,iconsEl,editorEl,pauseEl,winEl].forEach(function(el){
    el.classList.add('hidden');
  });
  pauseBtn.classList.add('hidden');
}
function showMain(){
  state='main'; paused=false; hideAllScreens();
  mainEl.classList.remove('hidden');
  curL=LEVELS[0]; reset();
}
function showLevels(){
  state='levels'; paused=false; hideAllScreens();
  buildLevelList();
  levelsEl.classList.remove('hidden');
  curL=LEVELS[0]; reset();
}
function showOnline(){
  state='online'; paused=false; hideAllScreens();
  buildUploadList();
  onlineEl.classList.remove('hidden');
  curL=LEVELS[0]; reset();
}
function showMyLevels(){
  state='mylevels'; paused=false; hideAllScreens();
  buildMyList();
  myEl.classList.remove('hidden');
  curL=LEVELS[0]; reset();
}
function showIcons(){
  state='icons'; paused=false; hideAllScreens();
  buildIconPicker();
  iconsEl.classList.remove('hidden');
  curL=LEVELS[0]; reset();
}
function buildIconPicker(){
  iconTabs.innerHTML='';
  ICON_MODES.forEach(function(m){
    const b=document.createElement('button');
    b.className='icontab'+(iconMode===m?' active':'');
    b.textContent=ICON_LABELS[m];
    b.addEventListener('click',function(e){ e.stopPropagation(); iconMode=m; buildIconPicker(); });
    iconTabs.appendChild(b);
  });
  iconGrid.innerHTML='';
  for(let i=0;i<10;i++){
    const b=document.createElement('button');
    b.className='iconpick'+(selectedIcons[iconMode]===i?' active':'');
    b.title=ICON_LABELS[iconMode]+' '+(i+1);
    const c=document.createElement('canvas');
    c.width=72; c.height=72;
    const pc=c.getContext('2d');
    pc.translate(36,36);
    drawIconShape(pc, iconMode, i, 48);
    b.appendChild(c);
    b.addEventListener('click',function(e){
      e.stopPropagation();
      selectedIcons[iconMode]=i;
      saveIcons();
      buildIconPicker();
      toast(ICON_LABELS[iconMode]+' icon '+(i+1)+' selected');
    });
    iconGrid.appendChild(b);
  }
}
function buildMyList(){
  const ls=getMyLevels();
  myList.innerHTML='';
  if(!ls.length){
    const d=document.createElement('div');
    d.className='sub2';
    d.textContent='No levels yet - hit CREATE NEW to start building!';
    myList.appendChild(d);
    return;
  }
  ls.forEach(function(u){
    const row=document.createElement('div');
    row.className='uprow';
    row.innerHTML='<span class="upname">'+escHtml(u.name)+'</span>'
      +'<button class="upbtn">EDIT</button>'
      +'<button class="upbtn gray">PLAY</button>'
      +'<button class="upbtn red">DEL</button>';
    const btns=row.querySelectorAll('button');
    btns[0].addEventListener('click',function(e){
      e.stopPropagation(); initAudio(); enterEditor(u.id);
    });
    btns[1].addEventListener('click',function(e){
      e.stopPropagation(); initAudio();
      const d=unpackLevel(u.d);
      if(objCount(d)<1){ toast('Level is empty - edit it first!'); return; }
      edCurId=u.id;
      startPlay(prepCustom(d),'test');
    });
    btns[2].addEventListener('click',function(e){
      e.stopPropagation();
      if(!window.confirm('Delete "'+u.name+'"?')) return;
      setMyLevels(getMyLevels().filter(function(x){ return x.id!==u.id; }));
      buildMyList();
    });
    myList.appendChild(row);
  });
}
function createNewLevel(){
  const id=Date.now().toString(36);
  const l=getMyLevels();
  l.unshift({id:id, name:'UNNAMED', d:{n:'UNNAMED',m:0,s:[],b:[],p:[],v:[],o:[],e:[],tg:[],sl:[]}});
  setMyLevels(l);
  enterEditor(id);
}
function startPlay(L, ctxType, li){
  if(ctxType!=='test') spawnStart=null;   // start-pos markers only affect editor TEST
  curL=L; playCtx={type:ctxType, li:(li==null?0:li)};
  songOffset=+L.mo||0;
  setTrack(L.track|0);
  attempts=1; state='play'; paused=false;
  hideAllScreens(); pauseBtn.classList.remove('hidden');
  reset(); initAudio();
}
function exitPlay(){
  if(playCtx.type==='campaign' && !P.dead) saveBest(playCtx.li, pctNow());
  paused=false;
  if(AC && AC.state==='suspended') AC.resume();
  if(playCtx.type==='test') enterEditor(edCurId);
  else if(playCtx.type==='detail') showDetail(detailEntry);
  else if(playCtx.type==='online') showOnline();
  else showLevels();
}
function onWin(){
  if(playCtx.type==='campaign') saveBest(playCtx.li, 100);
  state='win';
  pauseBtn.classList.add('hidden');
  winEl.classList.remove('hidden');
  winSfx();
}
function togglePause(){
  if(state!=='play') return;
  if(!paused){
    paused=true; held=false;
    pauseEl.classList.remove('hidden'); pauseBtn.classList.add('hidden');
    if(AC && AC.state==='running') AC.suspend();
    if(songAudio) songAudio.pause();
  } else {
    paused=false;
    pauseEl.classList.add('hidden'); pauseBtn.classList.remove('hidden');
    if(AC && AC.state==='suspended') AC.resume();
    if(TR && TR.file) startSong(TR, false);
  }
}

// ---------- menu lists ----------
function faceSVG(diff){
  const cfg={
    'EASY':         {c:'#4fc8ff', d:0, a:0},
    'NORMAL':       {c:'#4dff62', d:0, a:0},
    'HARD':         {c:'#ffb340', d:0, a:1},
    'HARDER':       {c:'#ff7a2f', d:0, a:2},
    'INSANE':       {c:'#ff4dd2', d:0, a:2},
    'EASY DEMON':   {c:'#ff7b5c', d:1, a:2},
    'MEDIUM DEMON': {c:'#ff3b3b', d:1, a:2},
    'HARD DEMON':   {c:'#b3002d', d:1, a:2},
    'INSANE DEMON': {c:'#9b1fd6', d:1, a:3},
    'EXTREME DEMON':{c:'#2a0012', d:2, a:3}
  }[diff] || {c:'#aaaaaa', d:0, a:0};
  let s='<svg width="34" height="34" viewBox="0 0 40 40">';
  if(cfg.d===1){
    s+='<path d="M8 14 L3 2 L15 9 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>'
      +'<path d="M32 14 L37 2 L25 9 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>';
  } else if(cfg.d===2){
    s+='<path d="M7 15 L0 0 L17 8 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>'
      +'<path d="M33 15 L40 0 L23 8 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="2"/>'
      +'<path d="M20 7 L17 0 L23 0 Z" fill="'+cfg.c+'" stroke="#111" stroke-width="1.6"/>';
  }
  s+='<circle cx="20" cy="22" r="15" fill="'+cfg.c+'" stroke="#111" stroke-width="2.5"/>';
  if(cfg.a===0){
    s+='<circle cx="14" cy="19" r="3.4" fill="#fff"/><circle cx="26" cy="19" r="3.4" fill="#fff"/>'
      +'<circle cx="14.8" cy="20" r="1.6" fill="#111"/><circle cx="26.8" cy="20" r="1.6" fill="#111"/>'
      +'<path d="M13 27 Q20 33 27 27" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  } else if(cfg.a===1){
    s+='<path d="M10 16 L18 19" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>'
      +'<path d="M30 16 L22 19" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>'
      +'<circle cx="14.5" cy="21.5" r="2.6" fill="#fff"/><circle cx="25.5" cy="21.5" r="2.6" fill="#fff"/>'
      +'<path d="M13 29 L27 29" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>';
  } else if(cfg.a===2){
    s+='<path d="M9 15 L18 20" stroke="#111" stroke-width="3" stroke-linecap="round"/>'
      +'<path d="M31 15 L22 20" stroke="#111" stroke-width="3" stroke-linecap="round"/>'
      +'<circle cx="14" cy="22" r="2.4" fill="#fff"/><circle cx="26" cy="22" r="2.4" fill="#fff"/>'
      +'<path d="M12 30 L16 27 L20 30 L24 27 L28 30" stroke="#111" stroke-width="2.5" fill="none" '
      +'stroke-linejoin="round" stroke-linecap="round"/>';
  } else {   // a===3: furious, fanged, glowing-eyed demon (insane / extreme)
    s+='<path d="M8 14 L19 19" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>'
      +'<path d="M32 14 L21 19" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>'
      +'<circle cx="14" cy="23" r="3" fill="#ffd23d"/><circle cx="26" cy="23" r="3" fill="#ffd23d"/>'
      +'<circle cx="14" cy="23" r="1.3" fill="#111"/><circle cx="26" cy="23" r="1.3" fill="#111"/>'
      +'<path d="M11 29 L15 32 L20 29 L25 32 L29 29" stroke="#111" stroke-width="2.5" fill="none" '
      +'stroke-linejoin="round" stroke-linecap="round"/>'
      +'<path d="M14 30 L15.2 34 L16.4 30 Z M23.6 30 L24.8 34 L26 30 Z" fill="#fff" stroke="#111" stroke-width="0.8"/>';
  }
  return s+'</svg>';
}
function buildLevelList(){
  lvlList.innerHTML='';
  LEVELS.forEach(function(L,i){
    const best=getBest(i);
    const el=document.createElement('div');
    el.className='lvlbtn';
    el.style.background='linear-gradient(135deg,hsl('+L.hue+',70%,42%),hsl('+((L.hue+45)%360)+',70%,28%))';
    el.innerHTML='<div class="lrow"><span class="lface">'+faceSVG(L.diff)+'</span>'
      +'<span class="lname">'+L.name+'</span><span class="ldiff">'+L.diff+'</span></div>'
      +'<div class="lbot"><div class="lbar"><div style="width:'+best+'%"></div></div>'
      +'<span class="lpct">'+best+'%</span></div>';
    el.addEventListener('click',function(e){
      e.stopPropagation(); initAudio(); startPlay(LEVELS[i],'campaign',i);
    });
    lvlList.appendChild(el);
  });
}
function escHtml(s){
  return (''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function buildUploadList(){
  const ups=getUploads().concat(BUILTIN_UPLOADS);
  upList.innerHTML='';
  const head=document.createElement('div');
  head.className='sub2';
  head.textContent=ups.length+' LEVEL'+(ups.length===1?'':'S')+' UPLOADED';
  upList.appendChild(head);
  ups.forEach(function(u){
    const meta=getMeta(u.id);
    const likes=levelBaseLikes(u)+(meta.liked?1:0);
    const row=document.createElement('div');
    row.className='uprow uprow-click';
    row.innerHTML='<span class="lface">'+faceSVG(meta.diff>=0?DIFFS[meta.diff]:'')+'</span>'
      +'<span class="upname">'+escHtml(u.name)+'</span>'
      +'<span class="upsummary">'+(meta.stars||0)+'&#9733; &#9829;'+likes+'</span>';
    row.addEventListener('click',function(e){
      e.stopPropagation(); initAudio(); showDetail(u);
    });
    upList.appendChild(row);
  });
}
// ---------- level detail page (per-device play / likes / rating) ----------
let detailEntry=null;
function showDetail(entry){
  detailEntry=entry;
  state='detail'; paused=false; hideAllScreens();
  detailEl.classList.remove('hidden');
  curL=LEVELS[0]; reset();
  renderDetail();
}
function renderDetail(){
  const e=detailEntry; if(!e) return;
  const meta=getMeta(e.id);
  const likes=levelBaseLikes(e)+(meta.liked?1:0);
  const dName=meta.diff>=0?DIFFS[meta.diff]:'UNRATED';
  const body=$('detailbody');
  body.innerHTML=
     '<div class="dtitle">'+escHtml(e.name)+'</div>'
    +'<div class="dface">'+faceSVG(meta.diff>=0?DIFFS[meta.diff]:'')+'</div>'
    +'<div class="dmeta">'+dName+' &bull; '+(meta.stars||0)+'&#9733; &bull; '
      +'<span class="dlikes">&#9829; '+likes+'</span></div>'
    +'<div class="drow">'
      +'<button class="navbtn green" id="dplay">&#9654; PLAY</button>'
      +'<button class="navbtn" id="dlike">'+(meta.liked?'&#9829; LIKED':'&#9825; LIKE')+'</button>'
    +'</div>'
    +'<div class="ratebox">'
      +'<div class="ratetitle">SET RATING &mdash; only you can see this</div>'
      +'<div class="bigstars" id="bigstars"></div>'
      +'<div class="raterow"><span>Difficulty:</span><select id="ddiff" class="rdiff2"></select></div>'
      +'<button class="navbtn green" id="dconfirm">CONFIRM</button>'
      +'<div class="ratehint">2&#9733; Easy &middot; 3&#9733; Normal &middot; 4-5&#9733; Hard &middot; '
        +'6-7&#9733; Harder &middot; 8-9&#9733; Insane &middot; 10&#9733; Demon</div>'
    +'</div>'
    +'<div class="drow">'
      +'<button class="navbtn" id="dcopy">COPY CODE</button>'
      +(e.builtin?'':'<button class="navbtn" id="ddel">DELETE</button>')
    +'</div>';

  let pStars=meta.stars||0;
  let pDiff=(meta.diff>=0?meta.diff:starToDiff(pStars||2));
  const ddiff=$('ddiff');
  DIFFS.forEach(function(dn,di){
    const o=document.createElement('option'); o.value=di; o.textContent=dn; ddiff.appendChild(o);
  });
  ddiff.value=pDiff;
  ddiff.addEventListener('change',function(){ pDiff=+ddiff.value; });
  ddiff.addEventListener('pointerdown',function(ev){ ev.stopPropagation(); });
  const bs=$('bigstars');
  function drawStars(){
    bs.innerHTML='';
    for(let s=1;s<=10;s++){
      const st=document.createElement('span');
      st.className='bstar'+(s<=pStars?' on':''); st.textContent=String.fromCharCode(9733);
      (function(sv){
        st.addEventListener('click',function(ev){
          ev.stopPropagation();
          pStars=(pStars===sv?0:sv);
          pDiff=starToDiff(pStars||2); ddiff.value=pDiff;
          drawStars();
        });
      })(s);
      bs.appendChild(st);
    }
  }
  drawStars();

  $('dplay').addEventListener('click',function(ev){
    ev.stopPropagation(); initAudio();
    const d=unpackLevel(e.d);
    if(objCount(d)<1){ toast('Level is empty'); return; }
    startPlay(prepCustom(d),'detail');
  });
  $('dlike').addEventListener('click',function(ev){
    ev.stopPropagation();
    const m=getMeta(e.id); m.liked=!m.liked; setMeta(e.id,m); renderDetail();
  });
  $('dconfirm').addEventListener('click',function(ev){
    ev.stopPropagation();
    const m=getMeta(e.id); m.stars=pStars; m.diff=pDiff; setMeta(e.id,m);
    toast('Rating updated!'); renderDetail();
  });
  $('dcopy').addEventListener('click',function(ev){
    ev.stopPropagation();
    const code=levelCode(unpackLevel(e.d));
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(function(){ toast('Level code copied!'); },
        function(){ window.prompt('Copy this level code:', code); });
    } else window.prompt('Copy this level code:', code);
  });
  if(!e.builtin){
    $('ddel').addEventListener('click',function(ev){
      ev.stopPropagation();
      if(!window.confirm('Delete "'+e.name+'"?')) return;
      setUploads(getUploads().filter(function(x){ return x.id!==e.id; }));
      showOnline();
    });
  }
}

// ---------- editor ----------
let ED={name:'UNNAMED', m:0, mo:0, oc:'255,255,255', spikes:[], blocks:[], portals:[], speeds:[], orbs:[], pads:[], decos:[], triggers:[], slopes:[], saws:[], starts:[]};
let activeStart=0;      // which start-pos the editor TEST spawns from (E/R switch)
let spawnStart=null;    // the start-pos object to spawn at during a test, or null
let edCamX=0, edTool='spike', edDown=false, edLastCell=null, edPanX=0;
let edHover=null, selA=null, selB=null, clip=null, edCurId=null;
let edSel=[];                                  // selected object refs (shown green)
let swiping=false, swX0=0, swY0=0, swCurX=0, swCurY=0;  // swipe-select box (pixels)
let edLayer=3;                                 // active layer (0-10) for new decorations

const TOOLS=[
  {id:'move',  grp:'TOOLS', hint:'MOVE: drag the view left/right (mouse wheel works too)'},
  {id:'rotate',grp:'TOOLS', hint:'ROTATE: tap any object to spin it 90 degrees'},
  {id:'erase', grp:'TOOLS', hint:'ERASE: tap / drag over objects to delete them'},
  {id:'sel',   grp:'TOOLS', hint:'COPY: tap a start column, then an end column to copy that section'},
  {id:'paste', grp:'TOOLS', hint:'PASTE: tap a column to paste the copied section there'},
  {id:'start', grp:'START', hint:'START POS: place a spawn point to test from. E = next start, R = previous start.'},
  {id:'pick',  grp:'SELECT', hint:'PICK: tap an object to select it (green). Tap the same spot again to cycle stacked objects.'},
  {id:'swipe', grp:'SELECT', hint:'SWIPE SELECT: drag a box to select everything inside, then SET GROUP / nudge / DELETE'},
  {id:'tmove', grp:'TRIGGERS', hint:'MOVE TRIGGER: when reached, slides a group id by a set amount (hitbox too). Select it to set group + distance.'},
  {id:'tcolor',grp:'TRIGGERS', hint:'COLOR TRIGGER: when reached, changes the background colour. Select it to pick the colour.'},
  {id:'spike', grp:'SPIKES', hint:'SPIKE: full spike. Tap to place / drag to paint. Use ROTATE to point it any way.'},
  {id:'shalf', grp:'SPIKES', hint:'HALF SPIKE: half-height spike'},
  {id:'smini', grp:'SPIKES', hint:'MINI SPIKE: small spike'},
  {id:'stiny', grp:'SPIKES', hint:'TINY SPIKE: tiniest spike'},
  {id:'spiked',grp:'SPIKES', hint:'CEILING SPIKE: full spike pointing down'},
  {id:'saw0',  grp:'SAWS', hint:'SAWBLADE (big): a spinning blade that kills on contact. Round hitbox.'},
  {id:'saw1',  grp:'SAWS', hint:'SAWBLADE (medium): a spinning blade that kills on contact.'},
  {id:'saw2',  grp:'SAWS', hint:'SAWBLADE (small): a spinning blade that kills on contact.'},
  {id:'gear0', grp:'SAWS', hint:'GEAR SAW (big): a spinning cog that kills on contact.'},
  {id:'gear1', grp:'SAWS', hint:'GEAR SAW (medium): a spinning cog that kills on contact.'},
  {id:'gear2', grp:'SAWS', hint:'GEAR SAW (small): a spinning cog that kills on contact.'},
  {id:'shur0', grp:'SAWS', hint:'SHURIKEN (big): a spinning ninja star that kills on contact.'},
  {id:'shur1', grp:'SAWS', hint:'SHURIKEN (medium): a spinning ninja star that kills on contact.'},
  {id:'block', grp:'BLOCKS', hint:'BLOCK (classic): tap a cell to place / drag to paint'},
  {id:'blockb',grp:'BLOCKS', hint:'BRICK BLOCK: brick-pattern solid'},
  {id:'blockt',grp:'BLOCKS', hint:'TECH BLOCK: circuit-pattern solid'},
  {id:'blockl',grp:'BLOCKS', hint:'LINE BLOCK: horizontal lines'},
  {id:'blockp',grp:'BLOCKS', hint:'PLATE BLOCK: metal plate with rivets'},
  {id:'blockg',grp:'BLOCKS', hint:'GRID BLOCK: fine cross-hatch grid'},
  {id:'blockh',grp:'BLOCKS', hint:'HATCH BLOCK: diagonal hatching'},
  {id:'blocks',grp:'BLOCKS', hint:'STUD BLOCK: studded dots'},
  {id:'orby',  grp:'BUILD', hint:'YELLOW ORB: tap mid-air on it for a full jump'},
  {id:'orbp',  grp:'BUILD', hint:'PINK ORB: tap mid-air on it for a small jump'},
  {id:'orbb',  grp:'BUILD', hint:'BLUE ORB: tap mid-air to flip gravity (all gamemodes)'},
  {id:'padp',  grp:'BUILD', hint:'PINK PAD: launches you up automatically on contact (small)'},
  {id:'pady',  grp:'BUILD', hint:'YELLOW PAD: launches you up automatically on contact (medium)'},
  {id:'padb',  grp:'BUILD', hint:'BLUE PAD: launches you up automatically on contact (big)'},
  {id:'slopeU',grp:'SLOPES', hint:'FLOOR SLOPE /: rising ramp, ride up it. ROTATE cycles all 4 orientations.'},
  {id:'slopeD',grp:'SLOPES', hint:'FLOOR SLOPE \\: falling ramp. Its tall LEFT side is a deadly wall.'},
  {id:'slopeCD',grp:'SLOPES', hint:'CEILING SLOPE (upside down): hangs from the top, fly modes slide under it.'},
  {id:'slopeCU',grp:'SLOPES', hint:'CEILING SLOPE (upside down): tall side is a deadly wall. The wave dies on any slope.'},
  {id:'pship', grp:'PORTALS', hint:'SHIP PORTAL: hold to fly. Floor = whole column, air = must be touched'},
  {id:'pball', grp:'PORTALS', hint:'BALL PORTAL (red): tap to flip gravity. Floor = whole column, air = must be touched'},
  {id:'pwave', grp:'PORTALS', hint:'WAVE PORTAL (blue): hold to glide up 45 degrees, release to glide down. Tiny hitbox.'},
  {id:'pcube', grp:'PORTALS', hint:'CUBE PORTAL: back to jumping. Floor = whole column, air = must be touched'},
  {id:'pufo',  grp:'PORTALS', hint:'UFO PORTAL (orange): tap to jump - even in mid-air (flappy style). Floor = whole column, air = must be touched'},
  {id:'pgdown',grp:'PORTALS', hint:'BLUE GRAVITY PORTAL: normal gravity (down). Floor = whole column, air = must be touched'},
  {id:'pgup',  grp:'PORTALS', hint:'YELLOW GRAVITY PORTAL: flipped gravity (up). Floor = whole column, air = must be touched'},
  {id:'s0',    grp:'SPEED', hint:'0.5x SPEED (yellow, slows down) - floor = whole column, air = must be touched'},
  {id:'s1',    grp:'SPEED', hint:'1x SPEED (blue, normal) - floor = whole column, air = must be touched'},
  {id:'s2',    grp:'SPEED', hint:'2x SPEED (green, faster) - floor = whole column, air = must be touched'},
  {id:'s3',    grp:'SPEED', hint:'3x SPEED (pink, fast!) - floor = whole column, air = must be touched'},
  {id:'s4',    grp:'SPEED', hint:'4x SPEED (red, very fast!) - floor = whole column, air = must be touched'},
  {id:'d0',    grp:'DECO', hint:'DECO SPIKE: background spike, no hitbox'},
  {id:'d1',    grp:'DECO', hint:'CHAIN: hanging chain links, no hitbox'},
  {id:'d2',    grp:'DECO', hint:'RING: glowing ring that pulses with the music'},
  {id:'d3',    grp:'DECO', hint:'CRYSTALS: glowing crystal cluster, no hitbox'},
  {id:'d4',    grp:'DECO', hint:'ARROW: decorative arrow sign, no hitbox'},
  {id:'d5',    grp:'DECO', hint:'OUTLINE BLOCK: see-through block, no hitbox'},
  {id:'d6',    grp:'DECO', hint:'CIRCLE: glowing ring, no hitbox'},
  {id:'d7',    grp:'DECO', hint:'STAR: glowing star, no hitbox'},
  {id:'d8',    grp:'DECO', hint:'PIPE: horizontal bar, no hitbox'},
  {id:'d9',    grp:'DECO', hint:'DOTS: 3x3 dot grid, no hitbox'},
  {id:'d10',   grp:'DECO', hint:'WAVE LINE: animated wavy line, no hitbox'},
  {id:'d11',   grp:'DECO', hint:'DIAMOND: outline diamond, no hitbox'}
];
// build an SVG path string for a pointed star (used by saw/shuriken icons)
function starPathStr(cx,cy,pts,R,r){
  let d='';
  for(let p=0;p<pts*2;p++){
    const a=-Math.PI/2+p*Math.PI/pts, rad=(p%2?r:R);
    d+=(p?'L':'M')+(cx+Math.cos(a)*rad).toFixed(1)+' '+(cy+Math.sin(a)*rad).toFixed(1)+' ';
  }
  return d+'Z';
}
// build an SVG path string for a toothed gear/cog icon
function gearPathStr(cx,cy,teeth,R,r){
  const step=Math.PI*2/teeth, f=step*0.30; let d='';
  for(let i=0;i<teeth;i++){
    const a=i*step, na=(i+1)*step;
    [[a-f,r],[a-f,R],[a+f,R],[a+f,r],[na-f,r]].forEach(function(q,idx){
      d+=((i===0&&idx===0)?'M':'L')+(cx+Math.cos(q[0])*q[1]).toFixed(1)+' '+(cy+Math.sin(q[0])*q[1]).toFixed(1)+' ';
    });
  }
  return d+'Z';
}
function toolIcon(id){
  const W22='width="26" height="26" viewBox="0 0 24 24"';
  // sawblade family: spiky saw (k0), gear (k1), shuriken (k2) - three sizes each
  if(id.charAt(0)==='s'&&id.slice(0,3)==='saw'){
    const R=[11,9,7][+id.slice(3)], r=R*0.62, hub=R*0.32;
    return '<svg '+W22+'><path d="'+starPathStr(12,12,12,R,r)+'" fill="#0a0e16" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>'
      +'<circle cx="12" cy="12" r="'+hub.toFixed(1)+'" fill="#3c4252" stroke="#fff" stroke-width="0.8"/>'
      +'<circle cx="12" cy="12" r="'+(hub*0.34).toFixed(1)+'" fill="#11151f"/></svg>';
  }
  if(id.slice(0,4)==='gear'){
    const R=[11,9,7][+id.slice(4)], r=R*0.74;
    return '<svg '+W22+'><path d="'+gearPathStr(12,12,8,R,r)+'" fill="#ced6eb" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/>'
      +'<circle cx="12" cy="12" r="'+(R*0.40).toFixed(1)+'" fill="#7a8298" stroke="#fff" stroke-width="0.8"/>'
      +'<circle cx="12" cy="12" r="'+(R*0.17).toFixed(1)+'" fill="#262e3c"/></svg>';
  }
  if(id.slice(0,4)==='shur'){
    const R=[11,9][+id.slice(4)];
    return '<svg '+W22+'><path d="'+starPathStr(12,12,8,R,R*0.34)+'" fill="#0a0c14" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>'
      +'<circle cx="12" cy="12" r="'+(R*0.22).toFixed(1)+'" fill="#b4aae6" stroke="#fff" stroke-width="0.8"/></svg>';
  }
  switch(id){
    case 'move': return '<svg '+W22+'><path d="M12 2 l3 4 h-6 z M12 22 l-3 -4 h6 z M2 12 l4 -3 v6 z M22 12 l-4 3 v-6 z" fill="#fff"/><rect x="10.5" y="10.5" width="3" height="3" fill="#fff"/></svg>';
    case 'rotate': return '<svg '+W22+'><path d="M6 12 a6 6 0 1 1 1.8 4.3" fill="none" stroke="#ffe14d" stroke-width="2.5" stroke-linecap="round"/><path d="M6 7 L6 12 L11 12" fill="none" stroke="#ffe14d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    case 'start': return '<svg '+W22+'><path d="M6 3 V21" stroke="#7CFC66" stroke-width="2" stroke-linecap="round"/><path d="M6 4 L18 7 L6 11 Z" fill="#7CFC66" stroke="#063" stroke-width="1"/></svg>';
    case 'pick': return '<svg '+W22+'><path d="M5 3 L5 18 L9 14 L12 20 L14 19 L11 13 L17 13 Z" fill="#7CFC66" stroke="#063" stroke-width="1.2"/></svg>';
    case 'swipe': return '<svg '+W22+'><rect x="3" y="5" width="18" height="14" fill="rgba(90,255,120,.2)" stroke="#5aff78" stroke-width="2" stroke-dasharray="3 2"/></svg>';
    case 'tmove': return '<svg '+W22+'><rect x="3" y="6" width="12" height="12" fill="rgba(40,150,255,.4)" stroke="#7fd0ff" stroke-width="1.5"/><path d="M13 12 L21 12 M18 9 L21 12 L18 15" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    case 'tcolor': return '<svg '+W22+'><path d="M12 3 L20 12 L12 21 L4 12 Z" fill="#ff5cd6" stroke="#fff" stroke-width="1.5"/></svg>';
    case 'spike': return '<svg '+W22+'><path d="M4 20 L12 4 L20 20 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'shalf': return '<svg '+W22+'><path d="M4 20 L12 11 L20 20 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'smini': return '<svg '+W22+'><path d="M7 20 L12 11 L17 20 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'stiny': return '<svg '+W22+'><path d="M9 20 L12 14 L15 20 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'spiked': return '<svg '+W22+'><path d="M4 4 L12 20 L20 4 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'block': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'blockb': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/><path d="M4 10 H20 M4 16 H20 M12 4 V10 M8 10 V16 M16 10 V16 M12 16 V20" stroke="rgba(255,255,255,.55)" stroke-width="1"/></svg>';
    case 'blockt': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/><path d="M4 9 H14 M10 15 H20 M14 9 V15" stroke="rgba(120,220,160,.8)" stroke-width="1"/><circle cx="14" cy="9" r="1.4" fill="#9fd"/><circle cx="10" cy="15" r="1.4" fill="#9fd"/></svg>';
    case 'blockl': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/><path d="M4 8 H20 M4 12 H20 M4 16 H20" stroke="rgba(255,255,255,.5)" stroke-width="1"/></svg>';
    case 'blockp': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/><rect x="7" y="7" width="10" height="10" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1"/><circle cx="7" cy="7" r="1.2" fill="#fff"/><circle cx="17" cy="7" r="1.2" fill="#fff"/><circle cx="7" cy="17" r="1.2" fill="#fff"/><circle cx="17" cy="17" r="1.2" fill="#fff"/></svg>';
    case 'blockg': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/><path d="M9 4 V20 M14 4 V20 M4 9 H20 M4 14 H20" stroke="rgba(255,255,255,.4)" stroke-width="1"/></svg>';
    case 'blockh': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/><path d="M4 12 L12 4 M4 20 L20 4 M12 20 L20 12" stroke="rgba(255,255,255,.45)" stroke-width="1"/></svg>';
    case 'blocks': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="#1a2238" stroke="#fff" stroke-width="2"/><circle cx="9" cy="9" r="1.3" fill="#fff"/><circle cx="15" cy="9" r="1.3" fill="#fff"/><circle cx="9" cy="15" r="1.3" fill="#fff"/><circle cx="15" cy="15" r="1.3" fill="#fff"/></svg>';
    case 'pship': return '<svg '+W22+'><ellipse cx="12" cy="12" rx="6" ry="10" fill="rgba(255,102,255,.3)" stroke="#ff66ff" stroke-width="2.5"/></svg>';
    case 'pball': return '<svg '+W22+'><ellipse cx="12" cy="12" rx="6" ry="10" fill="rgba(255,60,60,.3)" stroke="#ff5050" stroke-width="2.5"/></svg>';
    case 'pwave': return '<svg '+W22+'><ellipse cx="12" cy="12" rx="6" ry="10" fill="rgba(70,150,255,.3)" stroke="#4fa0ff" stroke-width="2.5"/></svg>';
    case 'pcube': return '<svg '+W22+'><ellipse cx="12" cy="12" rx="6" ry="10" fill="rgba(102,255,102,.3)" stroke="#66ff66" stroke-width="2.5"/></svg>';
    case 'slopeU': return '<svg '+W22+'><path d="M3 20 L21 20 L21 4 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'slopeD': return '<svg '+W22+'><path d="M3 20 L3 4 L21 20 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'slopeCD': return '<svg '+W22+'><path d="M3 4 L21 4 L21 20 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 'slopeCU': return '<svg '+W22+'><path d="M3 4 L21 4 L3 20 Z" fill="#1a2238" stroke="#fff" stroke-width="2"/></svg>';
    case 's0': return '<span style="color:#ffd83d">&#171;&#189;</span>';
    case 's1': return '<span style="color:#46a4ff">&#187;1</span>';
    case 's2': return '<span style="color:#4dff62">&#187;2</span>';
    case 's3': return '<span style="color:#ff5cd6">&#187;3</span>';
    case 's4': return '<span style="color:#ff4b4b">&#187;4</span>';
    case 'orby': return '<svg '+W22+'><circle cx="12" cy="12" r="7" fill="#ffe14d" stroke="#fff" stroke-width="2"/></svg>';
    case 'orbp': return '<svg '+W22+'><circle cx="12" cy="12" r="7" fill="#ff7bd5" stroke="#fff" stroke-width="2"/></svg>';
    case 'orbb': return '<svg '+W22+'><circle cx="12" cy="12" r="7" fill="#4fa0ff" stroke="#fff" stroke-width="2"/></svg>';
    case 'pady': return '<svg '+W22+'><path d="M4 18 L8 11 L16 11 L20 18 Z" fill="#ffe14d" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    case 'padp': return '<svg '+W22+'><path d="M4 18 L8 11 L16 11 L20 18 Z" fill="#ff7bd5" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    case 'padb': return '<svg '+W22+'><path d="M4 18 L8 11 L16 11 L20 18 Z" fill="#4fa0ff" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    case 'pufo': return '<svg '+W22+'><ellipse cx="12" cy="12" rx="6" ry="10" fill="rgba(255,150,40,.3)" stroke="#ff9628" stroke-width="2.5"/><ellipse cx="12" cy="13" rx="4.5" ry="1.8" fill="#ff9628"/><circle cx="12" cy="9.5" r="2.4" fill="none" stroke="#fff" stroke-width="1.5"/></svg>';
    case 'pgdown': return '<svg '+W22+'><ellipse cx="12" cy="12" rx="6" ry="10" fill="rgba(70,150,255,.3)" stroke="#4fa0ff" stroke-width="2.5"/><path d="M12 8 v8 M9 13 l3 3 3-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    case 'pgup': return '<svg '+W22+'><ellipse cx="12" cy="12" rx="6" ry="10" fill="rgba(255,225,77,.3)" stroke="#ffe14d" stroke-width="2.5"/><path d="M12 16 v-8 M9 11 l3-3 3 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    case 'erase': return '<svg '+W22+'><path d="M5 5 L19 19 M19 5 L5 19" stroke="#ff6666" stroke-width="3.5" stroke-linecap="round"/></svg>';
    case 'sel': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="none" stroke="#ffe14d" stroke-width="2" stroke-dasharray="4 3"/></svg>';
    case 'paste': return '<svg '+W22+'><rect x="5" y="3" width="11" height="14" fill="none" stroke="#fff" stroke-width="2"/><rect x="8" y="7" width="11" height="14" fill="#28304a" stroke="#fff" stroke-width="2"/></svg>';
    case 'd0': return '<svg '+W22+'><path d="M5 19 L12 7 L19 19 Z" fill="rgba(160,170,200,.5)"/></svg>';
    case 'd1': return '<svg '+W22+'><ellipse cx="12" cy="8" rx="3" ry="5" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"/><ellipse cx="12" cy="17" rx="3" ry="5" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"/></svg>';
    case 'd2': return '<svg '+W22+'><circle cx="12" cy="12" r="8" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2.5"/></svg>';
    case 'd3': return '<svg '+W22+'><path d="M4 20 L7 10 L10 20 Z M9 20 L13 5 L17 20 Z" fill="rgba(140,240,255,.6)" stroke="rgba(220,250,255,.8)" stroke-width="1"/></svg>';
    case 'd4': return '<svg '+W22+'><path d="M7 5 L16 12 L7 19" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    case 'd5': return '<svg '+W22+'><rect x="4" y="4" width="16" height="16" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/><rect x="9" y="9" width="6" height="6" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/></svg>';
    case 'd6': return '<svg '+W22+'><circle cx="12" cy="12" r="8" fill="rgba(120,200,255,.3)" stroke="#b4e1ff" stroke-width="2"/></svg>';
    case 'd7': return '<svg '+W22+'><path d="M12 3 L14 10 L21 10 L15 14 L17 21 L12 17 L7 21 L9 14 L3 10 L10 10 Z" fill="rgba(255,235,120,.6)" stroke="#fff5c8" stroke-width="1"/></svg>';
    case 'd8': return '<svg '+W22+'><rect x="2" y="10" width="20" height="5" fill="rgba(255,255,255,.15)" stroke="#fff" stroke-width="1.5"/></svg>';
    case 'd9': return '<svg '+W22+'><g fill="#fff"><circle cx="6" cy="6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></g></svg>';
    case 'd10': return '<svg '+W22+'><path d="M3 12 Q7 6 12 12 T21 12" fill="none" stroke="#96dcff" stroke-width="2.5" stroke-linecap="round"/></svg>';
    case 'd11': return '<svg '+W22+'><path d="M12 3 L21 12 L12 21 L3 12 Z" fill="none" stroke="#ffb4ff" stroke-width="2"/></svg>';
  }
  return '?';
}
function buildToolbar(){
  toolbarEl.innerHTML='';
  const order=[], byG={};
  TOOLS.forEach(function(t){
    if(!byG[t.grp]){ byG[t.grp]=[]; order.push(t.grp); }
    byG[t.grp].push(t);
  });
  order.forEach(function(gname){
    const g=document.createElement('div'); g.className='tgroup'+(gname==='SAWS'?' sawsgrp':'');
    const lab=document.createElement('div'); lab.className='tglabel'; lab.textContent=gname;
    const row=document.createElement('div'); row.className='tgrow';
    byG[gname].forEach(function(t){
      const b=document.createElement('button');
      b.className='tbtn'+(edTool===t.id?' active':'');
      b.innerHTML=toolIcon(t.id);
      b.title=t.hint;
      b.addEventListener('click',function(e){
        e.stopPropagation();
        edTool=t.id; selA=null; selB=null;
        buildToolbar(); setHint(t.hint);
      });
      row.appendChild(b);
    });
    g.appendChild(lab); g.appendChild(row);
    toolbarEl.appendChild(g);
  });
}
function setHint(h){ edHintEl.textContent=h; }
function enterEditor(id){
  const ls=getMyLevels();
  let entry=null;
  for(let i=0;i<ls.length;i++) if(ls[i].id===id){ entry=ls[i]; break; }
  if(!entry){ showMyLevels(); return; }
  edCurId=id;
  ED=unpackLevel(entry.d);
  groupOff={}; groupTarget={}; edSel=[]; activeStart=0;
  state='edit'; paused=false; hideAllScreens();
  editorEl.classList.remove('hidden');
  edNameIn.value=ED.name||'UNNAMED';
  edMusicSel.value=''+(ED.m||0);
  edMusOffIn.value=''+(+ED.mo||0);
  edObjColorIn.value=rgbToHex(ED.oc||'255,255,255');
  songOffset=+ED.mo||0;
  setTrack(ED.m||0);
  buildToolbar(); updateSelUI();
  setHint(TOOLS.filter(function(t){return t.id===edTool;})[0].hint);
}
function saveDraft(){
  ED.name=(edNameIn.value||'UNNAMED').toUpperCase().slice(0,20);
  const ls=getMyLevels();
  for(let i=0;i<ls.length;i++){
    if(ls[i].id===edCurId){ ls[i].name=ED.name; ls[i].d=packLevel(ED); break; }
  }
  setMyLevels(ls);
}
function cellAt(px,py){
  return {gx:Math.floor((edCamX+px)/B), gy:Math.floor((groundY-py)/B)};
}
function eraseAt(gx,gy){
  ED.spikes=ED.spikes.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  ED.orbs=ED.orbs.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  ED.pads=ED.pads.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  if(ED.starts){ ED.starts=ED.starts.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
    if(activeStart>=ED.starts.length) activeStart=Math.max(0,ED.starts.length-1); }
  ED.decos=ED.decos.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  ED.slopes=ED.slopes.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  ED.saws=ED.saws.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  ED.triggers=ED.triggers.filter(function(o){ return !(Math.round(o.gx)===gx && (o.gy||0)===gy); });
  ED.blocks=ED.blocks.filter(function(o){
    return !(gx>=o.gx && gx<o.gx+o.w && gy>=o.gy && gy<o.gy+o.h);
  });
  ED.portals=ED.portals.filter(function(o){ return !(o.gx===gx && (o.gy||0)===gy); });
  ED.speeds=ED.speeds.filter(function(o){ return !(o.gx===gx && (o.gy||0)===gy); });
}
function placeSpike(gx,gy,r,sz){
  ED.spikes=ED.spikes.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  ED.spikes.push({gx:gx,gy:gy,r:r,sz:sz});
}
function placeSlope(gx,gy,o){
  ED.slopes=ED.slopes.filter(function(s){ return !(s.gx===gx && s.gy===gy); });
  ED.slopes.push({gx:gx,gy:gy,o:o});
}
// editor tool id -> block visual style (t)
const BLOCK_TYPE={block:0, blockb:1, blockt:2, blockl:3, blockp:4, blockg:5, blockh:6, blocks:7};
function placeBlock(gx,gy,t){
  if(!ED.blocks.some(function(o){return gx>=o.gx&&gx<o.gx+o.w&&gy>=o.gy&&gy<o.gy+o.h;}))
    ED.blocks.push({gx:gx,gy:gy,w:1,h:1,t:t|0});
}
function placeStart(gx,gy){
  if(!ED.starts) ED.starts=[];
  let at=-1;
  for(let i=0;i<ED.starts.length;i++) if(ED.starts[i].gx===gx && ED.starts[i].gy===gy){ at=i; break; }
  if(at<0){ ED.starts.push({gx:gx,gy:gy}); at=ED.starts.length-1; }
  activeStart=at;   // newly placed one becomes the active spawn
  setHint('Start '+(at+1)+'/'+ED.starts.length+' placed - TEST spawns here. E next / R previous.');
}
function cycleStart(dir){
  const n=(ED.starts||[]).length;
  if(!n){ setHint('No start positions yet - place one with the START tool.'); return; }
  activeStart=((activeStart+dir)%n+n)%n;
  const s=ED.starts[activeStart];
  edCamX=Math.max(-2*B, s.gx*B - W*0.4);   // scroll it into view
  toast('Start '+(activeStart+1)+' / '+n);
  setHint('Active start '+(activeStart+1)+'/'+n+' - TEST spawns here. E next / R previous.');
}
// editor tool id -> [kind, size] for the sawblade family
const SAW_DEF={saw0:[0,0],saw1:[0,1],saw2:[0,2],
               gear0:[1,0],gear1:[1,1],gear2:[1,2],
               shur0:[2,0],shur1:[2,1]};
function placeSaw(gx,gy,k,sz){
  ED.saws=ED.saws.filter(function(o){ return !(o.gx===gx && o.gy===gy); });
  ED.saws.push({gx:gx,gy:gy,k:k,sz:sz});
}
// spike r encoding: 0 up, 1 down, 2 right, 3 left. ROTNEXT cycles them
// in visual clockwise order (up -> right -> down -> left) for the rotate tool.
const ROTNEXT={0:2, 2:1, 1:3, 3:0};
function rotateAt(gx,gy){
  for(let i=ED.spikes.length-1;i>=0;i--){
    const o=ED.spikes[i];
    if(o.gx===gx && o.gy===gy){ o.r=ROTNEXT[o.r||0]; saveDraft(); return true; }
  }
  for(let i=ED.decos.length-1;i>=0;i--){
    const o=ED.decos[i];
    if(o.gx===gx && o.gy===gy){ o.r=((o.r||0)+1)&3; saveDraft(); return true; }
  }
  for(let i=ED.slopes.length-1;i>=0;i--){
    const sp=ED.slopes[i];
    if(sp.gx===gx && sp.gy===gy){ sp.o=((sp.o||0)+1)&3; saveDraft(); return true; }  // cycle the 4 orientations
  }
  for(let i=ED.pads.length-1;i>=0;i--){
    const o=ED.pads[i];
    if(o.gx===gx && o.gy===gy){ o.r=((o.r||0)+1)&1; saveDraft(); return true; }  // floor <-> ceiling
  }
  for(let i=ED.portals.length-1;i>=0;i--){
    const o=ED.portals[i];
    if(o.gx===gx && (o.gy||0)===gy){ o.r=((o.r||0)+1)&3; saveDraft(); return true; }  // visual orientation
  }
  for(let i=ED.blocks.length-1;i>=0;i--){
    const o=ED.blocks[i];
    if(gx>=o.gx && gx<o.gx+o.w && gy>=o.gy && gy<o.gy+o.h){
      const t=o.w; o.w=o.h; o.h=t; saveDraft(); return true;
    }
  }
  setHint('Nothing to rotate here - tap right on an object');
  return false;
}
function applyTool(gx,gy){
  if(edTool==='pick'){ pickAt(gx,gy); return; }
  if(gx<0 || gy<0 || gy>8) return;
  switch(edTool){
    case 'rotate': rotateAt(gx,gy); return;
    case 'tmove': {
      const tr={type:'move',gx:gx,gy:gy,g:1,dx:4,dy:0};
      ED.triggers.push(tr); edSel=[tr]; updateSelUI();
      setHint('Move trigger placed. Set its group + distance below.');
      break;
    }
    case 'tcolor': {
      const tr={type:'color',gx:gx,gy:gy,hue:(hashStr(''+gx)%360)};
      ED.triggers.push(tr); edSel=[tr]; updateSelUI();
      setHint('Colour trigger placed. Pick the background colour below.');
      break;
    }
    case 'spike':  placeSpike(gx,gy,0,0); break;
    case 'shalf':  placeSpike(gx,gy,0,1); break;
    case 'smini':  placeSpike(gx,gy,0,2); break;
    case 'stiny':  placeSpike(gx,gy,0,3); break;
    case 'spiked': placeSpike(gx,gy,1,0); break;
    case 'saw0': case 'saw1': case 'saw2':
    case 'gear0': case 'gear1': case 'gear2':
    case 'shur0': case 'shur1': {
      const def=SAW_DEF[edTool]; placeSaw(gx,gy,def[0],def[1]); break;
    }
    case 'block': case 'blockb': case 'blockt': case 'blockl':
    case 'blockp': case 'blockg': case 'blockh': case 'blocks':
      placeBlock(gx,gy,BLOCK_TYPE[edTool]||0);
      break;
    case 'start': placeStart(gx,gy); break;
    case 'pship': case 'pcube': case 'pball': case 'pwave': case 'pgdown': case 'pgup': case 'pufo': {
      const pgy=Math.min(6,gy);  // dedupe per CELL so a column can hold several portals
      ED.portals=ED.portals.filter(function(o){return !(o.gx===gx && (o.gy||0)===pgy);});
      ED.portals.push({gx:gx, gy:pgy,
        m:(edTool==='pship'?'ship':edTool==='pball'?'ball':edTool==='pwave'?'wave'
          :edTool==='pgdown'?'gdown':edTool==='pgup'?'gup':edTool==='pufo'?'ufo':'cube')});
      break;
    }
    case 'slopeU': placeSlope(gx,gy,0); break;
    case 'slopeD': placeSlope(gx,gy,1); break;
    case 'slopeCD': placeSlope(gx,gy,2); break;
    case 'slopeCU': placeSlope(gx,gy,3); break;
    case 's0': case 's1': case 's2': case 's3': case 's4':
      ED.speeds=ED.speeds.filter(function(o){return o.gx!==gx;});
      ED.speeds.push({gx:gx, gy:Math.min(7,gy), t:+edTool.slice(1)});
      break;
    case 'orby': case 'orbp': case 'orbb':
      if(!ED.orbs.some(function(o){return o.gx===gx&&o.gy===gy;}))
        ED.orbs.push({gx:gx,gy:gy,k:edTool==='orby'?'y':edTool==='orbp'?'p':'b'});
      break;
    case 'pady': case 'padp': case 'padb':
      if(!ED.pads.some(function(o){return o.gx===gx&&o.gy===gy;}))
        ED.pads.push({gx:gx,gy:gy,k:edTool==='padp'?'p':edTool==='padb'?'b':'y'});
      break;
    case 'd0': case 'd1': case 'd2': case 'd3': case 'd4': case 'd5':
    case 'd6': case 'd7': case 'd8': case 'd9': case 'd10': case 'd11':
      if(!ED.decos.some(function(o){return o.gx===gx&&o.gy===gy&&o.k===+edTool.slice(1);}))
        ED.decos.push({gx:gx,gy:gy,k:+edTool.slice(1),z:edLayer});
      break;
    case 'erase': eraseAt(gx,gy); break;
    case 'sel':
      if(selA===null){ selA=gx; selB=null; setHint('Now tap the END column of the section to copy'); }
      else {
        selB=gx; copySelection();
      }
      break;
    case 'paste': pasteAt(gx); break;
  }
  saveDraft();
}
function copySelection(){
  const a=Math.min(selA,selB), b=Math.max(selA,selB);
  clip={len:b-a+1, spikes:[], blocks:[], portals:[], speeds:[], orbs:[], pads:[], decos:[], slopes:[], saws:[]};
  ED.spikes.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.spikes.push({gx:o.gx-a,gy:o.gy,r:o.r||0,sz:o.sz||0}); });
  ED.blocks.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.blocks.push({gx:o.gx-a,gy:o.gy,w:o.w,h:o.h,t:o.t||0}); });
  ED.portals.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.portals.push({gx:o.gx-a,gy:o.gy||0,m:o.m,r:o.r||0}); });
  ED.speeds.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.speeds.push({gx:o.gx-a,gy:o.gy||0,t:o.t}); });
  ED.orbs.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.orbs.push({gx:o.gx-a,gy:o.gy,k:o.k}); });
  ED.pads.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.pads.push({gx:o.gx-a,gy:o.gy,k:o.k,r:o.r||0}); });
  ED.decos.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.decos.push({gx:o.gx-a,gy:o.gy,k:o.k,r:o.r||0,z:(o.z!=null?o.z:2)}); });
  ED.slopes.forEach(function(s){ if(s.gx>=a&&s.gx<=b) clip.slopes.push({gx:s.gx-a,gy:s.gy,o:s.o||0}); });
  ED.saws.forEach(function(o){ if(o.gx>=a&&o.gx<=b) clip.saws.push({gx:o.gx-a,gy:o.gy,k:o.k||0,sz:o.sz||0}); });
  const n=clip.spikes.length+clip.blocks.length+clip.portals.length+clip.speeds.length
    +clip.orbs.length+clip.pads.length+clip.decos.length+clip.slopes.length+clip.saws.length;
  selA=null; selB=null;
  toast('Copied '+n+' objects - switch to PASTE');
  setHint('Copied '+n+' objects. Pick the PASTE tool and tap where to place them.');
}
function pasteAt(gx){
  if(!clip){ setHint('Nothing copied yet - use the COPY tool first'); return; }
  if(gx<0) gx=0;
  clip.spikes.forEach(function(o){ ED.spikes.push({gx:o.gx+gx,gy:o.gy,r:o.r||0,sz:o.sz||0}); });
  clip.blocks.forEach(function(o){ ED.blocks.push({gx:o.gx+gx,gy:o.gy,w:o.w,h:o.h,t:o.t||0}); });
  clip.portals.forEach(function(o){
    ED.portals=ED.portals.filter(function(p){return !(p.gx===o.gx+gx && (p.gy||0)===(o.gy||0));});
    ED.portals.push({gx:o.gx+gx,gy:o.gy||0,m:o.m,r:o.r||0});
  });
  clip.speeds.forEach(function(o){
    ED.speeds=ED.speeds.filter(function(p){return p.gx!==o.gx+gx;});
    ED.speeds.push({gx:o.gx+gx,gy:o.gy||0,t:o.t});
  });
  clip.orbs.forEach(function(o){ ED.orbs.push({gx:o.gx+gx,gy:o.gy,k:o.k}); });
  clip.pads.forEach(function(o){ ED.pads.push({gx:o.gx+gx,gy:o.gy,k:o.k,r:o.r||0}); });
  clip.decos.forEach(function(o){ ED.decos.push({gx:o.gx+gx,gy:o.gy,k:o.k,r:o.r||0,z:(o.z!=null?o.z:2)}); });
  clip.slopes.forEach(function(o){ ED.slopes.push({gx:o.gx+gx,gy:o.gy,o:o.o||0}); });
  clip.saws.forEach(function(o){ ED.saws.push({gx:o.gx+gx,gy:o.gy,k:o.k||0,sz:o.sz||0}); });
  toast('Pasted!');
}
// ---- selection (pick / swipe), grouping, nudge, delete ----
function objectsAt(gx,gy){
  const out=[];
  function pt(arr){ arr.forEach(function(o){ if(Math.round(o.gx)===gx && Math.round(o.gy||0)===gy) out.push(o); }); }
  pt(ED.spikes); pt(ED.orbs); pt(ED.pads); pt(ED.decos); pt(ED.portals); pt(ED.speeds); pt(ED.triggers); pt(ED.slopes); pt(ED.saws); if(ED.starts) pt(ED.starts);
  ED.blocks.forEach(function(o){
    const rx=Math.round(o.gx), ry=Math.round(o.gy||0);
    if(gx>=rx && gx<rx+o.w && gy>=ry && gy<ry+o.h) out.push(o);
  });
  return out;
}
function pickAt(gx,gy){
  const cands=objectsAt(gx,gy);
  if(!cands.length){ edSel=[]; updateSelUI(); setHint('Nothing here - tap an object'); return; }
  let idx=0;
  if(edSel.length===1){ const ci=cands.indexOf(edSel[0]); if(ci>=0) idx=(ci+1)%cands.length; }
  edSel=[cands[idx]]; updateSelUI();
  setHint('Picked 1 object'+(cands.length>1?' ('+(idx+1)+'/'+cands.length+' here - tap again to cycle)':''));
}
function finishSwipe(){
  swiping=false;
  const x0=Math.min(swX0,swCurX), x1=Math.max(swX0,swCurX);
  const y0=Math.min(swY0,swCurY), y1=Math.max(swY0,swCurY);
  const ax=Math.floor((edCamX+x0)/B), bx=Math.floor((edCamX+x1)/B);
  const c0=Math.floor((groundY-y0)/B), c1=Math.floor((groundY-y1)/B);
  const gy0=Math.min(c0,c1), gy1=Math.max(c0,c1);
  edSel=[];
  function within(arr){ arr.forEach(function(o){
    const rx=Math.round(o.gx), ry=Math.round(o.gy||0);
    if(rx>=ax&&rx<=bx&&ry>=gy0&&ry<=gy1) edSel.push(o);
  }); }
  within(ED.spikes); within(ED.orbs); within(ED.pads); within(ED.decos);
  within(ED.portals); within(ED.speeds); within(ED.triggers); within(ED.slopes); within(ED.saws);
  ED.blocks.forEach(function(o){
    const rx=Math.round(o.gx), ry=Math.round(o.gy||0);
    if(rx<=bx && rx+o.w-1>=ax && ry<=gy1 && ry+o.h-1>=gy0) edSel.push(o);
  });
  updateSelUI();
  setHint(edSel.length?('Selected '+edSel.length+' - use SET GROUP, LEFT/RIGHT nudge, or DELETE')
                      :'Empty selection');
}
function nudgeSelected(px){
  if(!edSel.length){ setHint('Pick or swipe-select something first'); return; }
  edSel.forEach(function(o){ o.gx += px/B; });
  saveDraft();
}
function nudgeSelectedY(px){    // +px = up (gy increases upward)
  if(!edSel.length){ setHint('Pick or swipe-select something first'); return; }
  edSel.forEach(function(o){ o.gy = (o.gy||0) + px/B; });
  saveDraft();
}
function setGroupSelected(){
  if(!edSel.length){ setHint('Select objects first (PICK or SWIPE)'); return; }
  const v=window.prompt('Group id for the '+edSel.length+' selected object(s):','1');
  if(v===null) return;
  const g=Math.max(0,parseInt(v,10)||0);
  edSel.forEach(function(o){ o.g=g; });
  saveDraft(); toast('Set group '+g+' on '+edSel.length+' object(s)');
}
function setLayerSelected(){
  if(!edSel.length){ setHint('Select decorations first, then SET LAYER'); return; }
  let n=0;
  edSel.forEach(function(o){ if(typeof o.k==='number'){ o.z=edLayer; n++; } });  // decos only
  if(!n){ setHint('Layers only apply to decorations'); return; }
  saveDraft(); toast('Set layer '+edLayer+' on '+n+' deco(s)');
}
function deleteSelected(){
  if(!edSel.length){ setHint('Nothing selected to delete'); return; }
  function rm(arr){ return arr.filter(function(o){ return edSel.indexOf(o)===-1; }); }
  ED.spikes=rm(ED.spikes); ED.blocks=rm(ED.blocks); ED.portals=rm(ED.portals);
  ED.speeds=rm(ED.speeds); ED.orbs=rm(ED.orbs); ED.pads=rm(ED.pads); ED.decos=rm(ED.decos);
  ED.triggers=rm(ED.triggers); ED.slopes=rm(ED.slopes); ED.saws=rm(ED.saws);
  if(ED.starts){ ED.starts=rm(ED.starts); if(activeStart>=ED.starts.length) activeStart=Math.max(0,ED.starts.length-1); }
  const n=edSel.length; edSel=[]; saveDraft(); updateSelUI(); toast('Deleted '+n+' object(s)');
}
function hueToHex(h){
  h=((h%360)+360)%360; const s=0.8,l=0.55;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r,g,b;
  if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
  function hx(v){ return ('0'+Math.round((v+m)*255).toString(16)).slice(-2); }
  return '#'+hx(r)+hx(g)+hx(b);
}
function hexToHue(hex){
  const n=parseInt(hex.slice(1),16);
  const r=(n>>16&255)/255, g=(n>>8&255)/255, b=(n&255)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; let h=0;
  if(d===0) h=0; else if(mx===r) h=60*(((g-b)/d)%6);
  else if(mx===g) h=60*((b-r)/d+2); else h=60*((r-g)/d+4);
  return Math.round((h+360)%360);
}
// object colour is stored as an "r,g,b" string (matches orb/speed colours)
function hexToRgb(hex){
  const n=parseInt((hex||'#ffffff').slice(1),16);
  return (n>>16&255)+','+(n>>8&255)+','+(n&255);
}
function rgbToHex(rgb){
  const p=(''+(rgb||'255,255,255')).split(',');
  function hx(v){ v=Math.max(0,Math.min(255,parseInt(v,10)||0)); return ('0'+v.toString(16)).slice(-2); }
  return '#'+hx(p[0])+hx(p[1])+hx(p[2]);
}
function updateSelUI(){
  const info=$('edselinfo'); if(info) info.textContent='Sel: '+edSel.length;
  const tc=$('trigcfg'); if(!tc) return;
  if(edSel.length===1 && edSel[0].type){ tc.classList.remove('hidden'); buildTrigCfg(edSel[0]); }
  else tc.classList.add('hidden');
}
function buildTrigCfg(tr){
  const tc=$('trigcfg');
  if(tr.type==='move'){
    tc.innerHTML='<span class="tclab">MOVE &raquo;</span>'
      +'group <input id="tcg" type="number" min="0" value="'+(tr.g||0)+'">'
      +'X <input id="tcx" type="number" step="0.5" value="'+(tr.dx||0)+'">'
      +'Y <input id="tcy" type="number" step="0.5" value="'+(tr.dy||0)+'">'
      +'<span class="tchint">blocks</span>';
    const g=$('tcg'), x=$('tcx'), y=$('tcy');
    [g,x,y].forEach(function(el){ el.addEventListener('pointerdown',function(e){ e.stopPropagation(); }); });
    g.addEventListener('input',function(){ tr.g=Math.max(0,parseInt(g.value,10)||0); saveDraft(); });
    x.addEventListener('input',function(){ tr.dx=parseFloat(x.value)||0; saveDraft(); });
    y.addEventListener('input',function(){ tr.dy=parseFloat(y.value)||0; saveDraft(); });
  } else {
    tc.innerHTML='<span class="tclab">COLOR &raquo;</span> background '
      +'<input id="tcc" type="color" value="'+hueToHex(tr.hue||0)+'">';
    const c=$('tcc');
    c.addEventListener('pointerdown',function(e){ e.stopPropagation(); });
    c.addEventListener('input',function(){ tr.hue=hexToHue(c.value); saveDraft(); });
  }
}
function drawSelection(){
  ctx.lineWidth=2.5;
  edSel.forEach(function(o){
    let gx0,gy0,wc,hc;
    if(o.w){ gx0=o.gx; gy0=o.gy; wc=o.w; hc=o.h; }
    else { gx0=o.gx; gy0=(o.gy||0); wc=1; hc=1; }
    const px=gx0*B-camX, py=groundY-(gy0+hc)*B;
    ctx.fillStyle='rgba(80,255,120,0.22)';
    ctx.fillRect(px,py,wc*B,hc*B);
    ctx.strokeStyle='rgba(90,255,120,0.95)';
    ctx.strokeRect(px,py,wc*B,hc*B);
  });
  if(swiping){
    const x0=Math.min(swX0,swCurX), y0=Math.min(swY0,swCurY);
    const w=Math.abs(swCurX-swX0), h=Math.abs(swCurY-swY0);
    ctx.setLineDash([8,6]); ctx.lineWidth=2;
    ctx.fillStyle='rgba(90,255,120,0.12)'; ctx.strokeStyle='rgba(90,255,120,0.9)';
    ctx.fillRect(x0,y0,w,h); ctx.strokeRect(x0,y0,w,h);
    ctx.setLineDash([]);
  }
}
// editor pointer handling on the canvas
cv.addEventListener('pointerdown', function(e){
  if(state!=='edit') return;
  edDown=true; edPanX=e.clientX;
  if(edTool==='move') return;
  if(edTool==='swipe'){ swiping=true; swX0=swCurX=e.clientX; swY0=swCurY=e.clientY; return; }
  const c=cellAt(e.clientX, e.clientY);
  edLastCell=c.gx+'_'+c.gy;
  applyTool(c.gx, c.gy);
});
cv.addEventListener('pointermove', function(e){
  if(state!=='edit') return;
  edHover={x:e.clientX, y:e.clientY};
  if(!edDown) return;
  if(edTool==='move'){
    edCamX=Math.max(-2*B, edCamX-(e.clientX-edPanX)); edPanX=e.clientX;
    return;
  }
  if(edTool==='swipe'){ swCurX=e.clientX; swCurY=e.clientY; return; }
  if(edTool==='spike'||edTool==='shalf'||edTool==='smini'||edTool==='stiny'||
     edTool==='spiked'||edTool.slice(0,5)==='block'||edTool==='erase'||edTool.charAt(0)==='d'||
     edTool==='slopeU'||edTool==='slopeD'||edTool==='slopeCU'||edTool==='slopeCD'||
     edTool.slice(0,3)==='saw'||edTool.slice(0,4)==='gear'||edTool.slice(0,4)==='shur'){
    const c=cellAt(e.clientX, e.clientY);
    const key=c.gx+'_'+c.gy;
    if(key!==edLastCell){ edLastCell=key; applyTool(c.gx,c.gy); }
  }
});
window.addEventListener('pointerup', function(){
  edDown=false; edLastCell=null;
  if(swiping) finishSwipe();
});
window.addEventListener('wheel', function(e){
  if(state==='edit') edCamX=Math.max(-2*B, edCamX + (e.deltaY||0));
}, {passive:true});

// editor buttons
$('edtest').addEventListener('click', function(e){
  e.stopPropagation(); saveDraft(); initAudio();
  const st=ED.starts||[];
  spawnStart = st.length ? st[activeStart % st.length] : null;   // TEST from the active start
  startPlay(prepCustom(ED), 'test');
});
$('edsave').addEventListener('click', function(e){
  e.stopPropagation(); saveDraft(); toast('Draft saved on this device');
});
$('edupload').addEventListener('click', function(e){
  e.stopPropagation(); saveDraft();
  if(objCount(ED)<3){ toast('Add at least 3 objects first!'); return; }
  const ups=getUploads();
  ups.unshift({id:Date.now().toString(36), name:ED.name, d:packLevel(ED), date:Date.now()});
  setUploads(ups);
  toast('Uploaded! Find it under UPLOADED LEVELS');
});
$('edclear').addEventListener('click', function(e){
  e.stopPropagation();
  if(!window.confirm('Clear the whole level?')) return;
  ED={name:ED.name, m:ED.m|0, mo:+ED.mo||0, oc:ED.oc||'255,255,255', spikes:[], blocks:[], portals:[], speeds:[], orbs:[], pads:[], decos:[], triggers:[], slopes:[], saws:[], starts:[]};
  activeStart=0;
  edSel=[]; updateSelUI(); saveDraft();
});
$('edexit').addEventListener('click', function(e){
  e.stopPropagation(); saveDraft(); showMyLevels();
});
edNameIn.addEventListener('input', function(){ saveDraft(); });
edNameIn.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
TRACKS.forEach(function(tr,i){
  const o=document.createElement('option');
  o.value=i; o.textContent=String.fromCharCode(9835)+' '+tr.name;
  edMusicSel.appendChild(o);
});
edMusicSel.addEventListener('change', function(){
  ED.m=(+edMusicSel.value)||0; saveDraft();
  initAudio();
  setTrack(ED.m); // preview the track right away while editing
});
edMusicSel.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
edObjColorIn.addEventListener('input', function(){
  ED.oc=hexToRgb(edObjColorIn.value); saveDraft(); // live-updates the editor view
});
edObjColorIn.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
edMusOffIn.addEventListener('input', function(){
  ED.mo=Math.max(0, parseFloat(edMusOffIn.value)||0); songOffset=ED.mo; saveDraft();
  initAudio(); setTrack(ED.m); // re-preview the song from the new start offset
});
edMusOffIn.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
$('ednudgeL').addEventListener('click', function(e){ e.stopPropagation(); nudgeSelected(-10); });
$('ednudgeR').addEventListener('click', function(e){ e.stopPropagation(); nudgeSelected(10); });
$('ednudgeU').addEventListener('click', function(e){ e.stopPropagation(); nudgeSelectedY(10); });
$('ednudgeD').addEventListener('click', function(e){ e.stopPropagation(); nudgeSelectedY(-10); });
$('edgroup').addEventListener('click', function(e){ e.stopPropagation(); setGroupSelected(); });
$('edsetlayer').addEventListener('click', function(e){ e.stopPropagation(); setLayerSelected(); });
$('eddel').addEventListener('click', function(e){ e.stopPropagation(); deleteSelected(); });
(function(){ const sel=$('edlayer'); for(let z=0;z<=10;z++){ const o=document.createElement('option'); o.value=z; o.textContent=z; sel.appendChild(o); } sel.value=edLayer; })();
$('edlayer').addEventListener('change', function(){ edLayer=+this.value; });
$('edlayer').addEventListener('pointerdown', function(e){ e.stopPropagation(); });

// ---------- input ----------
function press(){
  initAudio();
  if(state==='win'){
    winEl.classList.add('hidden');
    exitPlay();
    return;
  }
  if(state==='play' && !paused){
    held=true; pressBuf=8; flipQueued=true;
  }
}
window.addEventListener('pointerdown', function(e){
  if(e.target && e.target.closest &&
     e.target.closest('button,input,select,.lvlbtn,.uprow,.upitem,#editorui')) return;
  if(state!=='edit') e.preventDefault();
  press();
});
window.addEventListener('pointerup', function(){ held=false; });
window.addEventListener('pointercancel', function(){ held=false; });
muteBtn.addEventListener('click', function(e){ e.stopPropagation(); toggleMute(); });
pauseBtn.addEventListener('click', function(e){ e.stopPropagation(); togglePause(); });
$('btnplay').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); showLevels(); });
$('btneditor').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); showMyLevels(); });
$('btnicons').addEventListener('click', function(e){ e.stopPropagation(); showIcons(); });
$('createbtn').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); createNewLevel(); });
$('backmylevels').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('btnonline').addEventListener('click', function(e){ e.stopPropagation(); initAudio(); showOnline(); });
$('backlevels').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('backonline').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('backdetail').addEventListener('click', function(e){ e.stopPropagation(); showOnline(); });
$('backicons').addEventListener('click', function(e){ e.stopPropagation(); showMain(); });
$('importbtn').addEventListener('click', function(e){
  e.stopPropagation();
  const code=window.prompt('Paste a level code (starts with JD1.):');
  if(!code) return;
  const d=decodeLevel(code);
  if(!d){ toast('Invalid level code'); return; }
  const ups=getUploads();
  ups.unshift({id:Date.now().toString(36), name:d.name, d:packLevel(d), date:Date.now()});
  setUploads(ups);
  buildUploadList();
  toast('Imported "'+d.name+'"!');
});
$('presume').addEventListener('click', function(e){ e.stopPropagation(); togglePause(); });
$('prestart').addEventListener('click', function(e){
  e.stopPropagation();
  attempts++; reset();
  paused=false; pauseEl.classList.add('hidden'); pauseBtn.classList.remove('hidden');
  if(AC && AC.state==='suspended') AC.resume();
});
$('pexit').addEventListener('click', function(e){
  e.stopPropagation(); pauseEl.classList.add('hidden'); exitPlay();
});
window.addEventListener('keydown', function(e){
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){
    if(e.target===edNameIn) return;
    e.preventDefault();
    if(!e.repeat) press(); else if(state==='play' && !paused) held=true;
  } else if(e.code==='KeyM'){ if(e.target!==edNameIn) toggleMute(); }
  else if(e.code==='KeyR' && state==='play' && !paused && !P.dead && e.target!==edNameIn){
    attempts++; reset();
  }
  else if((e.code==='KeyE'||e.code==='KeyR') && state==='edit'
          && e.target!==edNameIn && e.target.tagName!=='INPUT'){
    cycleStart(e.code==='KeyE' ? 1 : -1);   // E = next start, R = previous start
  }
  else if((e.code==='Delete'||e.code==='Backspace') && state==='edit'
          && e.target!==edNameIn && e.target.tagName!=='INPUT'){
    e.preventDefault(); deleteSelected();
  }
  else if(e.code==='Escape'){
    if(state==='play') togglePause();
    else if(state==='edit'){ saveDraft(); showMyLevels(); }
    else if(state==='detail') showOnline();
    else if(state==='levels'||state==='online'||state==='mylevels'||state==='icons') showMain();
    else if(state==='win'){ winEl.classList.add('hidden'); exitPlay(); }
  }
});
window.addEventListener('keyup', function(e){
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW') held=false;
});
window.addEventListener('resize', resize);

// ---------- simulation ----------
function die(){
  P.dead=true; deadT=0; shake=14;
  deathX=P.x+B/2; deathY=P.y+B/2;
  if(playCtx.type==='campaign') saveBest(playCtx.li, pctNow());
  for(let i=0;i<32;i++){
    const a=Math.random()*Math.PI*2, v=B*(0.05+Math.random()*0.14);
    particles.push({x:deathX,y:deathY,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
      g:0.04*B/44, life:34, max:34, size:B*(0.08+Math.random()*0.1),
      col: Math.random()<0.6 ? '90,255,110' : '255,255,255'});
  }
  deathSfx();
}
function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--;
    if(p.life<=0) particles.splice(i,1);
  }
}
// spike hitbox for any rotation (0 up, 1 down, 2 right, 3 left) and
// size (0 normal, 1 half, 2 mini, 3 tiny)
function spikeBox(s){
  const r=s.r||0, sz=s.sz||0, gx=egx(s), gy=egy(s);
  const cx=(gx+0.5)*B, bot=groundY-gy*B, top=bot-B, cyc=bot-B/2;
  const LA=[0.60,0.30,0.32,0.18][sz]*B;   // length along the point
  const WA=[0.28,0.28,0.16,0.10][sz]*B;   // width across the base
  const PAD=[0.12,0.12,0.06,0.04][sz]*B;
  let sl,sr,st,sb;
  if(r===0){ sl=cx-WA/2; sr=cx+WA/2; sb=bot-PAD; st=sb-LA; }
  else if(r===1){ sl=cx-WA/2; sr=cx+WA/2; st=top+PAD; sb=st+LA; }
  else if(r===2){ st=cyc-WA/2; sb=cyc+WA/2; sl=gx*B+PAD; sr=sl+LA; }
  else { st=cyc-WA/2; sb=cyc+WA/2; sr=(gx+1)*B-PAD; sl=sr-LA; }
  return {sl:sl, sr:sr, st:st, sb:sb};
}
function step(){
  ftick++;
  if(state!=='play' || paused){ if(!paused) updateParticles(); return; }
  if(P.dead){
    deadT++;
    if(deadT>55){ attempts++; reset(); }
    updateParticles(); return;
  }
  const prevY = P.y, prevBottom = P.y + B;
  P.x += SPEED*speedMult;

  // portals/speed arrows: on the floor (gy 0) they gate the whole column;
  // placed in the air they must actually be touched
  for(let i=0;i<curL.portals.length;i++){
    if(portalHit[i]) continue;
    const p=curL.portals[i], pgx=egx(p), pgy=egy(p);
    const horiz=((p.r||0)&1)===1;   // rotate tool turned it on its side
    if(pgy>0 || horiz){
      // hitbox matches the drawn ellipse and rotates with it: tall & narrow when
      // upright, short & wide when sideways. centred on the portal graphic.
      const cx=(pgx+0.5)*B, cy=groundY-(pgy+1.5)*B;
      const halfW=(horiz?1.6:0.55)*B, halfH=(horiz?0.55:1.6)*B;
      if(P.x+B <= cx-halfW || P.x >= cx+halfW) continue;
      if(P.y+B <= cy-halfH || P.y >= cy+halfH) continue;
    } else {
      // upright floor portal keeps its forgiving full-column gate (existing levels)
      if(P.x+B <= pgx*B || P.x >= (pgx+1)*B) continue;
    }
    portalHit[i]=true;
    if(p.m==='gdown') snapGravity(1, false, true);
    else if(p.m==='gup') snapGravity(-1, false, true);
    else mode=p.m;
  }
  for(let i=0;i<curL.speeds.length;i++){
    if(speedHit[i]) continue;
    const sg=curL.speeds[i], sgx=egx(sg), sgy=egy(sg);
    if(P.x+B <= sgx*B || P.x >= (sgx+1)*B) continue;
    if(sgy>0){
      const top=groundY-(sgy+2)*B, bot=groundY-sgy*B;
      if(P.y+B <= top || P.y >= bot) continue;
    }
    speedHit[i]=true; speedMult=SPDS[sg.t].m;
  }
  // triggers: fire once when the player's centre passes them
  if(curL.triggers) for(let i=0;i<curL.triggers.length;i++){
    if(trigFired[i]) continue;
    const tr=curL.triggers[i];
    if(P.x+B/2 < tr.gx*B) continue;
    trigFired[i]=true;
    if(tr.type==='color'){
      bgHueTarget=((tr.hue||0)%360+360)%360;
    } else if(tr.g){
      if(!groupTarget[tr.g]) groupTarget[tr.g]={x:0,y:0};
      groupTarget[tr.g].x += (tr.dx||0);
      groupTarget[tr.g].y += (tr.dy||0);
    }
  }

  // after a gravity flip the player floats briefly (low gravity) before momentum builds
  const gsw = gravSwing>0 ? 0.16 : 1;
  if(mode==='ship'){
    P.vy += held ? -0.017*B*gdir : 0.013*B*gdir;
    const mv=0.30*B;
    if(P.vy >  mv) P.vy =  mv;
    if(P.vy < -mv) P.vy = -mv;
  } else if(mode==='wave'){
    P.vy = (held ? -1 : 1) * SPEED*speedMult * gdir;
  } else if(mode==='ball'){
    // flip gravity only while resting on a surface (floor / ceiling / block)
    if(flipQueued && P.onGround){ toggleGravity(); }
    P.vy += GRAV*gsw*gdir;
    const mv=B*0.55;
    if(P.vy >  mv) P.vy =  mv;
    if(P.vy < -mv) P.vy = -mv;
  } else if(mode==='ufo'){
    // flappy: every tap kicks you upward, even in mid-air
    if(flipQueued){ P.vy = -JUMPV*0.86*gdir; P.onGround=false; }
    P.vy += GRAV*gsw*gdir;
    const mv=B*0.6;
    if(gdir>0){ if(P.vy >  mv) P.vy =  mv; }
    else { if(P.vy < -mv) P.vy = -mv; }
  } else {
    if(held && P.onGround){ P.vy = -JUMPV*gdir; P.onGround=false; }
    P.vy += GRAV*gsw*gdir;
    const mv=B*0.6;
    if(gdir>0){ if(P.vy >  mv) P.vy =  mv; }
    else { if(P.vy < -mv) P.vy = -mv; }
  }
  if(gravSwing>0) gravSwing--;
  flipQueued=false;
  P.y += P.vy;
  P.onGround = false;

  const hbi = (mode==='wave') ? B*0.30 : 0;   // the wave has a smaller hitbox
  const fly = (mode==='ship'||mode==='ball'||mode==='wave');
  // the ufo isn't a "fly" mode, but it also bonks (not dies) on ceilings/undersides
  const soft = fly || mode==='ufo';
  const prevPB = prevY + B - hbi, prevPT = prevY + hbi;

  if(gdir>0){
    if(P.y + B - hbi >= groundY){ P.y = groundY - B + hbi; P.vy = 0; P.onGround = true; }
    if(soft && P.y + hbi <= ceilingY()){
      P.y = ceilingY() - hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
    }
  } else {
    if(P.y + hbi <= ceilingY()){
      P.y = ceilingY() - hbi; P.vy = 0; P.onGround = true;
    }
    if(soft && P.y + B - hbi >= groundY){
      P.y = groundY - B + hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
    }
  }

  // slopes first: floor ramps push you up, ceiling ramps push you down, the tall
  // vertical side is a deadly wall, and the wave can't ride - it crashes and dies.
  let onSlope=false, floorSurf=Infinity, ceilSurf=Infinity;
  if(curL.slopes){
    const advx=SPEED*speedMult;
    for(let i=0;i<curL.slopes.length;i++){
      const s=curL.slopes[i], sgx=egx(s), sgy=egy(s), o=(s.o!=null?s.o:(s.dir||0));
      const cxp=P.x+B/2;
      if(cxp <= sgx*B || cxp >= (sgx+1)*B) continue;
      const f=(cxp - sgx*B)/B;
      const baseBot=groundY-sgy*B, baseTop=groundY-(sgy+1)*B;
      const ceil=(o>=2), tallLeft=(o===1||o===3);
      const surf=(o===0||o===3) ? baseBot - f*B : baseTop + f*B;
      const entered=((cxp-advx) <= sgx*B);   // crossed into the cell this frame
      if(!ceil){
        const foot=P.y+B-hbi;
        if(foot < surf-2) continue;             // above the ramp: flying over it
        if(foot > baseBot + B*0.5) continue;     // far below: passing under an elevated ramp
        if(tallLeft && entered && (foot-surf) > B*0.4){ die(); updateParticles(); return; }
        if(mode==='wave'){ die(); updateParticles(); return; }
        onSlope=true; if(surf<floorSurf) floorSurf=surf;
      } else {
        const head=P.y+hbi;
        if(head > surf+2) continue;             // below the underside: flying under it
        if(head < baseTop - B*0.5) continue;     // far above
        if(tallLeft && entered && (surf-head) > B*0.4){ die(); updateParticles(); return; }
        if(mode==='wave'){ die(); updateParticles(); return; }
        onSlope=true; if(surf<ceilSurf) ceilSurf=surf;
      }
    }
  }
  if(floorSurf<Infinity && P.vy>=-0.01){ P.y=floorSurf-B+hbi; P.vy=0; P.onGround=true; }
  if(ceilSurf<Infinity){ P.y=ceilSurf-hbi; if(P.vy<0) P.vy=0; if(mode!=='cube') P.onGround=true; }

  // blocks (skipped entirely while riding a ramp - the ramp owns our footing)
  for(let i=0;i<curL.blocks.length && !onSlope;i++){
    const b=curL.blocks[i], bgx=egx(b), bgy=egy(b);
    const L=bgx*B, R=(bgx+b.w)*B, T=groundY-(bgy+b.h)*B, BO=groundY-bgy*B;
    if(P.x+B-hbi-2 <= L || P.x+hbi+2 >= R) continue;
    if(P.y+B-hbi <= T || P.y+hbi >= BO) continue;
    if(gdir>0){
      if(P.vy >= 0 && prevPB <= T + Math.max(10, P.vy*1.5)){
        P.y = T - B + hbi; P.vy = 0; P.onGround = true;
      } else if(P.vy <= 0 && prevPT >= BO - Math.max(10, -P.vy*1.5)){
        if(mode==='ship'||mode==='wave'||mode==='ufo'){ P.y = BO - hbi; P.vy = 0; }
        else if(mode==='ball'){ P.y = BO - hbi; P.vy = 0; P.onGround = true; }
        else { die(); updateParticles(); return; }
      } else if(P.y+B-hbi - T < B*0.3){
        P.y = T - B + hbi; P.vy = 0; P.onGround = true;
      } else if(soft && BO - (P.y+hbi) < B*0.3){
        P.y = BO - hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
      } else { die(); updateParticles(); return; }
    } else {
      if(P.vy <= 0 && prevPT >= BO - Math.max(10, -P.vy*1.5)){
        P.y = BO - hbi; P.vy = 0; P.onGround = true;
      } else if(P.vy >= 0 && prevPB <= T + Math.max(10, P.vy*1.5)){
        if(soft){ P.y = T - B + hbi; P.vy = 0; if(mode==='ball') P.onGround = true; }
        else { die(); updateParticles(); return; }
      } else if(BO - (P.y+hbi) < B*0.3){
        P.y = BO - hbi; P.vy = 0; P.onGround = true;
      } else if(soft && P.y+B-hbi - T < B*0.3){
        P.y = T - B + hbi; P.vy = 0; if(mode==='ball') P.onGround = true;
      } else { die(); updateParticles(); return; }
    }
  }

  // cube dies on the far surface when gravity is flipped
  if(mode==='cube'){
    if(gdir>0 && P.y + hbi <= ceilingY()){ die(); updateParticles(); return; }
    if(gdir<0 && P.y + B - hbi >= groundY){ die(); updateParticles(); return; }
  }

  for(let i=0;i<curL.spikes.length;i++){
    const k=spikeBox(curL.spikes[i]);
    const mh=6+hbi, mv=4+hbi;
    if(P.x+B-mh > k.sl && P.x+mh < k.sr && P.y+B-mv > k.st && P.y+mv < k.sb){
      die(); updateParticles(); return;
    }
  }

  // sawblades: round hitbox vs the player box (nearest-point circle test)
  if(curL.saws){
    for(let i=0;i<curL.saws.length;i++){
      const s=curL.saws[i];
      const cx=(egx(s)+0.5)*B, cy=groundY-(egy(s)+0.5)*B, rad=SAW_HIT[s.sz||0]*B;
      const nx=Math.max(P.x+hbi, Math.min(cx, P.x+B-hbi));
      const ny=Math.max(P.y+hbi, Math.min(cy, P.y+B-hbi));
      const dx=cx-nx, dy=cy-ny;
      if(dx*dx+dy*dy < rad*rad){ die(); updateParticles(); return; }
    }
  }

  // orbs: tap while overlapping for a mid-air boost
  if(pressBuf>0 && curL.orbs){
    for(let i=0;i<curL.orbs.length;i++){
      if(orbUsed[i]) continue;
      const o=curL.orbs[i];
      const dx=P.x+B/2-(egx(o)+0.5)*B, dy=P.y+B/2-(groundY-(egy(o)+0.5)*B);
      if(dx*dx+dy*dy < 1.1*B*B){
        if(o.k==='b'){
          toggleGravity(); orbUsed[i]=true; pressBuf=0;
          for(let j=0;j<10;j++){
            const a=Math.random()*Math.PI*2, v=B*(0.04+Math.random()*0.08);
            particles.push({x:P.x+B/2,y:P.y+B/2,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
              g:0, life:16, max:16, size:B*0.09, col:'70,150,255'});
          }
          orbSfx();
        } else {
          P.vy = mode==='ship' ? -JUMPV*0.8*gdir
               : mode==='ball' ? -JUMPV*gdir*(o.k==='p'?0.7:0.95)
               : -JUMPV*gdir*(o.k==='p'?0.75:1);
          P.onGround=false; orbUsed[i]=true; pressBuf=0;
          const oc = o.k==='p' ? '255,123,213' : '255,225,77';
          for(let j=0;j<10;j++){
            const a=Math.random()*Math.PI*2, v=B*(0.04+Math.random()*0.08);
            particles.push({x:P.x+B/2,y:P.y+B/2,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
              g:0, life:16, max:16, size:B*0.09, col:oc});
          }
          orbSfx();
        }
        break;
      }
    }
  }
  if(pressBuf>0) pressBuf--;

  // pads: fire automatically on contact (no tap needed). Per-pad cooldown so a
  // single touch fires once. pink = small launch, yellow = medium launch,
  // blue = flip gravity (momentum zeroed, then you fall the new way - like the
  // gravity portals). Rotation (r) flips a launch pad to point the other way.
  if(curL.pads){
    for(let i=0;i<curL.pads.length;i++){
      if(padCool[i]>0){ padCool[i]--; continue; }
      const pd=curL.pads[i];
      const px=(egx(pd)+0.5)*B, py=groundY-(egy(pd)+0.5)*B;
      if(Math.abs(P.x+B/2-px) < B*0.55 && Math.abs(P.y+B/2-py) < B*0.62){
        padCool[i]=14;
        const oc = pd.k==='p' ? '255,123,213' : pd.k==='b' ? '70,150,255' : '255,225,77';
        if(pd.k==='b'){
          snapGravity(-gdir, false);   // flip gravity, zero momentum, then drift up
        } else {
          const f = pd.k==='p' ? 0.85 : 1.2;
          const sgn = (pd.r===1) ? 1 : -1;   // r=1 = ceiling pad: launches downward
          P.vy = sgn*JUMPV*f*gdir; P.onGround=false;
        }
        for(let j=0;j<12;j++){
          const a=Math.random()*Math.PI*2, v=B*(0.05+Math.random()*0.09);
          particles.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
            g:0, life:18, max:18, size:B*0.1, col:oc});
        }
        orbSfx();
      }
    }
  }

  if(mode==='ship'){
    const tgt = Math.atan2(P.vy, SPEED*speedMult*2.5);
    P.rot += (tgt - P.rot)*0.3;
    if(held && ftick%2===0){
      particles.push({x:P.x-2, y:P.y+B*0.7,
        vx:-(2+Math.random()*2), vy:(Math.random()-0.3)*1.5,
        g:0, life:14, max:14, size:B*0.12, col:'255,170,60'});
    }
  } else if(mode==='wave'){
    P.rot += (((held?-1:1)*gdir*Math.PI/4) - P.rot)*0.5;
    if(ftick%2===0){
      particles.push({x:P.x+B*0.3, y:P.y+B/2,
        vx:-(2+Math.random()*2), vy:0,
        g:0, life:14, max:14, size:B*0.12, col:'120,200,255'});
    }
  } else if(mode==='ball'){
    P.rot += (SPEED*speedMult/B)*0.95*gdir;   // roll
    if(P.onGround && ftick%3===0){
      particles.push({x:P.x+3, y:P.y+(gdir>0?B-2:2),
        vx:-(1+Math.random()*2), vy:(gdir>0?-1:1)*(0.5+Math.random()),
        g:0.1*gdir, life:16, max:16, size:B*0.1, col:'255,240,150'});
    }
  } else if(mode==='ufo'){
    P.rot += (0 - P.rot)*0.3;   // stays upright
    if(ftick%2===0){           // engine puffs below the saucer
      particles.push({x:P.x+B*0.5, y:P.y+(gdir>0?B-2:2),
        vx:-(1+Math.random()*2), vy:(gdir>0?1:-1)*(0.4+Math.random()),
        g:0, life:14, max:14, size:B*0.1, col:'255,150,40'});
    }
  } else if(P.onGround){
    const target = Math.round(P.rot/(Math.PI/2))*(Math.PI/2);
    P.rot += (target - P.rot)*0.5;
    if(ftick%3===0){
      const py = gdir>0 ? P.y+B-2 : P.y+2;
      particles.push({x:P.x+3, y:py,
        vx:-(1+Math.random()*2), vy:(gdir>0?-1:1)*(0.5+Math.random()*1.5),
        g:0.1*gdir, life:18, max:18, size:B*0.1, col:'255,240,150'});
    }
  } else {
    P.rot += ROTS*gdir;
  }

  shipAnim += (((mode==='ship'||mode==='ball'||mode==='wave')?1:0) - shipAnim)*0.08;
  // ease grouped objects toward their move-trigger targets, and bg toward color triggers
  for(const g in groupTarget){
    if(!groupOff[g]) groupOff[g]={x:0,y:0};
    groupOff[g].x += (groupTarget[g].x-groupOff[g].x)*0.12;
    groupOff[g].y += (groupTarget[g].y-groupOff[g].y)*0.12;
  }
  const dHue=((bgHueTarget-bgHueCur+540)%360)-180;
  bgHueCur=(bgHueCur+dHue*0.08+360)%360;
  camX = P.x - playerScreenX();
  if(P.x >= curL.endX*B){ onWin(); }
  updateParticles();
}

// ---------- decoration ----------
function decoFor(L){
  if(L._deco) return L._deco;
  let s = ((L.endX*7919) + ((L.hue|0)*104729) + 12345)>>>0;
  function rnd(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }
  const towers=[], mids=[], stars=[], gdeco=[], hills=[], rotors=[], cols=[], dust=[];
  for(let i=0;i<48;i++) towers.push({x:i*7+rnd()*4, w:3+rnd()*3.5, h:2.5+rnd()*6.5});
  for(let i=0;i<36;i++) mids.push({x:i*9+rnd()*6, w:1+rnd()*2, h:1.5+rnd()*4, o:0.06+rnd()*0.08});
  for(let i=0;i<60;i++) stars.push({x:rnd()*340, y:0.05+rnd()*0.75, r:1+rnd()*2.2, tw:rnd()*6.28});
  for(let i=0;i<160;i++) gdeco.push({x:i*4+rnd()*3, k:(rnd()*3)|0});
  for(let i=0;i<20;i++) hills.push({x:i*18+rnd()*9, w:9+rnd()*10, h:1.5+rnd()*3.2});
  for(let i=0;i<22;i++) rotors.push({x:i*15+rnd()*9, y:0.08+rnd()*0.5, s:0.7+rnd()*1.3, sp:(rnd()-0.5)*0.05});
  for(let i=0;i<32;i++) cols.push({x:i*11+rnd()*6, w:0.5+rnd()*0.8, h:1+rnd()*2.6});
  for(let i=0;i<40;i++) dust.push({x:rnd()*360, y:rnd()*0.95, r:1+rnd()*2.2, ph:rnd()*6.28});
  return L._deco={towers:towers, mids:mids, stars:stars, gdeco:gdeco,
                  hills:hills, rotors:rotors, cols:cols, dust:dust};
}
function wrap(v, span){ return ((v%span)+span)%span; }
function drawDeco(hue){
  const D=decoFor(curL);
  // twinkling stars
  for(let i=0;i<D.stars.length;i++){
    const st=D.stars[i];
    const sx=wrap(st.x*B - camX*0.12, W+120) - 60;
    const sy=st.y*groundY;
    const a=0.25+0.35*Math.abs(Math.sin(ftick*0.04+st.tw));
    ctx.fillStyle='rgba(255,255,255,'+a+')';
    ctx.fillRect(sx, sy, st.r, st.r);
  }
  // distant hill silhouettes
  const spanH=380*B;
  ctx.fillStyle='hsla('+hue+',55%,11%,0.5)';
  for(let i=0;i<D.hills.length;i++){
    const hl=D.hills[i];
    const sx=wrap(hl.x*B - camX*0.18, spanH)-100;
    if(sx>-hl.w*B && sx<W+50){
      ctx.beginPath();
      ctx.moveTo(sx, groundY);
      ctx.lineTo(sx+hl.w*B/2, groundY-hl.h*B);
      ctx.lineTo(sx+hl.w*B, groundY);
      ctx.closePath(); ctx.fill();
    }
  }
  // far tower silhouettes
  ctx.fillStyle='hsla('+hue+',60%,9%,0.55)';
  const span1=340*B;
  for(let i=0;i<D.towers.length;i++){
    const tw=D.towers[i];
    const sx=wrap(tw.x*B - camX*0.3, span1);
    if(sx>-tw.w*B && sx<W+tw.w*B){
      const th=tw.h*B*0.9;
      ctx.fillRect(sx-60, groundY-th, tw.w*B, th);
    }
  }
  // mid floating outline shapes
  ctx.lineWidth=2;
  const span2=330*B;
  for(let i=0;i<D.mids.length;i++){
    const m=D.mids[i];
    const sx=wrap(m.x*B - camX*0.55, span2);
    if(sx>-100 && sx<W+100){
      ctx.strokeStyle='rgba(255,255,255,'+m.o+')';
      ctx.strokeRect(sx-50, groundY-(m.h+2.2)*B, m.w*B, m.w*B);
    }
  }
  // slowly rotating shapes that pulse with the kick
  const spanR=336*B;
  for(let i=0;i<D.rotors.length;i++){
    const r=D.rotors[i];
    const sx=wrap(r.x*B - camX*0.5, spanR)-70;
    if(sx>-80 && sx<W+80){
      ctx.save();
      ctx.translate(sx, r.y*groundY);
      ctx.rotate(ftick*r.sp*0.1);
      ctx.strokeStyle='rgba(255,255,255,'+(0.06+0.06*pulse)+')';
      ctx.lineWidth=2;
      const rs=r.s*B;
      ctx.strokeRect(-rs/2,-rs/2,rs,rs);
      ctx.restore();
    }
  }
  // near ground columns
  const spanC=352*B;
  for(let i=0;i<D.cols.length;i++){
    const c=D.cols[i];
    const sx=wrap(c.x*B - camX*0.7, spanC)-80;
    if(sx>-60 && sx<W+60){
      ctx.fillStyle='hsla('+hue+',50%,7%,0.7)';
      ctx.fillRect(sx, groundY-c.h*B, c.w*B, c.h*B);
      ctx.fillStyle='rgba(255,255,255,0.10)';
      ctx.fillRect(sx, groundY-c.h*B, c.w*B, 3);
    }
  }
}
function drawDust(){
  const D=decoFor(curL);
  for(let i=0;i<D.dust.length;i++){
    const d=D.dust[i];
    const sx=wrap(d.x*B - camX*1.18, W+240)-120;
    const sy=d.y*groundY + Math.sin(ftick*0.012+d.ph)*18;
    ctx.fillStyle='rgba(255,255,255,'+(0.08+0.07*Math.abs(Math.sin(ftick*0.02+d.ph)))+')';
    ctx.fillRect(sx, sy, d.r, d.r);
  }
}
function drawGroundDeco(){
  const D=decoFor(curL);
  const span=640*B;
  ctx.fillStyle='rgba(255,255,255,0.07)';
  for(let i=0;i<D.gdeco.length;i++){
    const g=D.gdeco[i];
    const sx=wrap(g.x*B - camX, span);
    if(sx>-40 && sx<W+40){
      if(g.k===0) ctx.fillRect(sx, groundY+B*0.45, B*0.32, B*0.32);
      else if(g.k===1) ctx.fillRect(sx, groundY+B*1.1, B*0.5, B*0.16);
      else ctx.fillRect(sx, groundY+B*0.8, B*0.18, B*0.18);
    }
  }
}

// ---------- rendering ----------
function line(a,b,c,d){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.stroke(); }

function drawBlock(b){
  const x=egx(b)*B-camX, y=groundY-(egy(b)+b.h)*B, w=b.w*B, h=b.h*B;
  if(x+w<0 || x>W) return;
  const t=b.t||0, oc=objColorCur;
  ctx.fillStyle='rgba(5,8,20,0.9)'; ctx.fillRect(x,y,w,h);
  ctx.save();
  ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();   // keep interior patterns inside
  ctx.lineWidth=1.5;
  if(t===1){            // BRICK: staggered courses
    ctx.strokeStyle='rgba('+oc+',0.30)';
    const rh=B*0.5;
    for(let yy=y+rh, r=0; yy<y+h-0.5; yy+=rh, r++) line(x,yy,x+w,yy);
    for(let yy=y, r=0; yy<y+h; yy+=rh, r++){
      const off=(r&1)?B*0.5:0;
      for(let xx=x+off; xx<x+w; xx+=B) line(xx,yy,xx,Math.min(yy+rh,y+h));
    }
  } else if(t===2){     // TECH: circuit traces + nodes
    ctx.strokeStyle='rgba('+oc+',0.28)';
    for(let yy=y+B*0.35; yy<y+h; yy+=B*0.7) line(x,yy,x+w,yy);
    ctx.fillStyle='rgba('+oc+',0.55)';
    for(let xx=x+B*0.3; xx<x+w; xx+=B*0.6) for(let yy=y+B*0.35; yy<y+h; yy+=B*0.7) ctx.fillRect(xx-2,yy-2,4,4);
  } else if(t===3){     // LINES: horizontal
    ctx.strokeStyle='rgba('+oc+',0.30)';
    for(let yy=y+B*0.33; yy<y+h-0.5; yy+=B*0.33) line(x,yy,x+w,yy);
  } else if(t===4){     // PLATE: bevel + corner rivets
    ctx.strokeStyle='rgba('+oc+',0.5)'; ctx.lineWidth=2;
    ctx.strokeRect(x+B*0.18,y+B*0.18,w-B*0.36,h-B*0.36);
    ctx.fillStyle='rgba('+oc+',0.6)';
    const rr=Math.max(2,B*0.07), m=B*0.28;
    [[x+m,y+m],[x+w-m,y+m],[x+m,y+h-m],[x+w-m,y+h-m]].forEach(function(p){
      ctx.beginPath(); ctx.arc(p[0],p[1],rr,0,Math.PI*2); ctx.fill(); });
  } else if(t===5){     // GRID: fine cross-hatch
    ctx.strokeStyle='rgba('+oc+',0.22)';
    for(let xx=x+B*0.5; xx<x+w; xx+=B*0.5) line(xx,y,xx,y+h);
    for(let yy=y+B*0.5; yy<y+h; yy+=B*0.5) line(x,yy,x+w,yy);
  } else if(t===6){     // HATCH: diagonal
    ctx.strokeStyle='rgba('+oc+',0.25)';
    for(let d=-h; d<w; d+=B*0.4) line(x+d,y+h,x+d+h,y);
  } else if(t===7){     // STUDS: dot grid
    ctx.fillStyle='rgba('+oc+',0.4)';
    const sp=B*0.5, rr=Math.max(1.5,B*0.06);
    for(let xx=x+sp*0.5; xx<x+w; xx+=sp) for(let yy=y+sp*0.5; yy<y+h; yy+=sp){
      ctx.beginPath(); ctx.arc(xx,yy,rr,0,Math.PI*2); ctx.fill(); }
  } else {              // 0 = CLASSIC: faint per-cell grid
    ctx.strokeStyle='rgba('+oc+',0.18)';
    for(let i=1;i<b.w;i++) line(x+i*B,y,x+i*B,y+h);
    for(let j=1;j<b.h;j++) line(x,y+j*B,x+w,y+j*B);
  }
  ctx.restore();
  ctx.strokeStyle='rgba('+oc+',0.92)'; ctx.lineWidth=2.5;
  ctx.strokeRect(x+1.5,y+1.5,w-3,h-3);
}
function drawSpike(s){
  const x=egx(s)*B-camX;
  if(x+B<0 || x>W) return;
  const r=s.r||0, sz=s.sz||0;
  ctx.save();
  ctx.translate(x+B/2, groundY-(egy(s)+0.5)*B);
  ctx.rotate([0, Math.PI, Math.PI/2, -Math.PI/2][r]);
  ctx.fillStyle='rgba(5,8,20,0.9)';
  ctx.beginPath();
  if(sz===1){ // half spike: full base, half height
    ctx.moveTo(-B/2+2, B/2); ctx.lineTo(0, 0); ctx.lineTo(B/2-2, B/2);
  } else {
    const scl=[1,1,0.55,0.3][sz];
    const w=(B/2-2)*scl, h=(B-4)*scl;
    ctx.moveTo(-w, B/2); ctx.lineTo(0, B/2-h); ctx.lineTo(w, B/2);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=2.5; ctx.stroke();
  ctx.restore();
}
// sawblade sizes (× block B): visual radius and the forgiving round hitbox radius
const SAW_R   = [0.92, 0.64, 0.44];
const SAW_HIT = [0.58, 0.42, 0.29];
function sawSpikyPath(R){
  const teeth=12, inner=R*0.64;
  ctx.beginPath();
  for(let i=0;i<teeth;i++){
    const a0=i/teeth*Math.PI*2, a1=(i+0.5)/teeth*Math.PI*2;
    if(i===0) ctx.moveTo(Math.cos(a0)*R, Math.sin(a0)*R);
    else ctx.lineTo(Math.cos(a0)*R, Math.sin(a0)*R);
    ctx.lineTo(Math.cos(a1)*inner, Math.sin(a1)*inner);
  }
  ctx.closePath();
}
function sawGearPath(R){
  const teeth=8, step=Math.PI*2/teeth, f=step*0.30, inner=R*0.74;
  ctx.beginPath();
  for(let i=0;i<teeth;i++){
    const a=i*step, na=(i+1)*step;
    const pts=[[a-f,inner],[a-f,R],[a+f,R],[a+f,inner],[na-f,inner]];
    pts.forEach(function(q,idx){
      const px=Math.cos(q[0])*q[1], py=Math.sin(q[0])*q[1];
      if(i===0&&idx===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    });
  }
  ctx.closePath();
}
function sawStarPath(R,pts,innerF){
  const inner=R*innerF;
  ctx.beginPath();
  for(let p=0;p<pts*2;p++){
    const a=p/(pts*2)*Math.PI*2, rad=(p%2?inner:R);
    if(p===0) ctx.moveTo(Math.cos(a)*rad, Math.sin(a)*rad);
    else ctx.lineTo(Math.cos(a)*rad, Math.sin(a)*rad);
  }
  ctx.closePath();
}
function drawSaw(s){
  const x=(egx(s)+0.5)*B-camX, y=groundY-(egy(s)+0.5)*B;
  const R=SAW_R[s.sz||0]*B;
  if(x+R<0 || x-R>W) return;
  const k=s.k||0, dir=(s.gx&1)?-1:1, ang=ftick*0.12*dir;
  ctx.save();
  ctx.translate(x,y); ctx.rotate(ang);
  ctx.lineJoin='round';
  if(k===1){            // gear / cog
    sawGearPath(R);
    ctx.fillStyle='rgba(206,214,235,0.96)'; ctx.fill();
    ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=Math.max(2,R*0.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.40,0,Math.PI*2);
    ctx.fillStyle='rgba(118,128,158,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=Math.max(1.5,R*0.04); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.17,0,Math.PI*2);
    ctx.fillStyle='rgba(34,40,56,0.95)'; ctx.fill();
  } else if(k===2){     // shuriken / ninja star
    sawStarPath(R,8,0.34);
    ctx.fillStyle='rgba(10,12,20,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba('+objColorCur+',0.9)'; ctx.lineWidth=Math.max(2,R*0.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.22,0,Math.PI*2);
    ctx.fillStyle='rgba(180,170,230,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=Math.max(1.5,R*0.04); ctx.stroke();
  } else {              // classic spiky sawblade
    sawSpikyPath(R);
    ctx.fillStyle='rgba(8,10,16,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=Math.max(2,R*0.06); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.33,0,Math.PI*2);
    ctx.fillStyle='rgba(58,64,82,0.95)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=Math.max(1.5,R*0.04); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,R*0.11,0,Math.PI*2);
    ctx.fillStyle='rgba(17,21,31,0.95)'; ctx.fill();
  }
  ctx.restore();
  ctx.lineJoin='miter';
}
function drawSlope(s){
  const gx=egx(s), gy=egy(s), x=gx*B-camX, o=(s.o!=null?s.o:(s.dir||0));
  if(x+B<0 || x>W) return;
  const bot=groundY-gy*B, top=groundY-(gy+1)*B;
  ctx.fillStyle='rgba(5,8,20,0.9)';
  ctx.strokeStyle='rgba('+objColorCur+',0.92)'; ctx.lineWidth=2.5; ctx.lineJoin='round';
  ctx.beginPath();
  if(o===0){ ctx.moveTo(x,bot); ctx.lineTo(x+B,bot); ctx.lineTo(x+B,top); }      // floor / (rising)
  else if(o===1){ ctx.moveTo(x,bot); ctx.lineTo(x,top); ctx.lineTo(x+B,bot); }    // floor \ (falling)
  else if(o===2){ ctx.moveTo(x,top); ctx.lineTo(x+B,top); ctx.lineTo(x+B,bot); }  // ceiling (tall right)
  else { ctx.moveTo(x,top); ctx.lineTo(x+B,top); ctx.lineTo(x,bot); }             // ceiling (tall left)
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineJoin='miter';
}
function drawSpeed(s){
  const cfg=SPDS[s.t], x0=egx(s)*B-camX;
  if(x0+3*B<0 || x0-B>W) return;
  const yT=groundY-(egy(s)+1.55)*B, hh=1.4*B, aw=0.5*B, gap=0.34*B;
  ctx.strokeStyle='rgba('+cfg.c+',0.95)';
  ctx.lineWidth=Math.max(3,B*0.11);
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(let i=0;i<cfg.n;i++){
    const bx=x0+i*gap;
    ctx.beginPath();
    if(cfg.rev){
      ctx.moveTo(bx+aw,yT); ctx.lineTo(bx,yT+hh/2); ctx.lineTo(bx+aw,yT+hh);
    } else {
      ctx.moveTo(bx,yT); ctx.lineTo(bx+aw,yT+hh/2); ctx.lineTo(bx,yT+hh);
    }
    ctx.stroke();
  }
  ctx.lineJoin='miter'; ctx.lineCap='butt';
}
// decoration objects: purely visual, no hitbox.
// k: 0 spike silhouette, 1 chain link, 2 pulsing ring, 3 crystals,
//    4 arrow sign, 5 outline block
function drawDecoObj(d){
  const x=egx(d)*B-camX, bot=groundY-egy(d)*B;
  if(x+2*B<0 || x-B>W) return;
  ctx.save();
  if(d.r){ const rcx=x+B/2, rcy=bot-B/2;
    ctx.translate(rcx,rcy); ctx.rotate((d.r||0)*Math.PI/2); ctx.translate(-rcx,-rcy); }
  switch(d.k){
    case 0:
      ctx.fillStyle='rgba(10,14,30,0.55)';
      ctx.beginPath();
      ctx.moveTo(x+B*0.15,bot); ctx.lineTo(x+B/2,bot-B*0.7); ctx.lineTo(x+B*0.85,bot);
      ctx.closePath(); ctx.fill();
      break;
    case 1: {
      const top=bot-B;
      ctx.strokeStyle='rgba(255,255,255,0.30)'; ctx.lineWidth=Math.max(2,B*0.07);
      for(let j=0;j<2;j++){
        ctx.beginPath();
        ctx.ellipse(x+B/2, top+B*0.25+j*B*0.5, B*0.10, B*0.2, 0, 0, Math.PI*2);
        ctx.stroke();
      }
      break;
    }
    case 2: {
      const r=B*(0.45+0.15*pulse)+B*0.05*Math.sin(ftick*0.07+d.gx);
      ctx.strokeStyle='rgba(255,255,255,'+(0.16+0.18*pulse)+')';
      ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(x+B/2, bot-B*0.5, r, 0, Math.PI*2); ctx.stroke();
      break;
    }
    case 3:
      ctx.fillStyle='rgba(140,240,255,0.35)';
      ctx.strokeStyle='rgba(200,250,255,0.5)'; ctx.lineWidth=1.5;
      [[0.2,0.45],[0.5,0.75],[0.78,0.4]].forEach(function(c){
        ctx.beginPath();
        ctx.moveTo(x+B*(c[0]-0.12),bot);
        ctx.lineTo(x+B*c[0],bot-B*c[1]);
        ctx.lineTo(x+B*(c[0]+0.12),bot);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      break;
    case 4: {
      const cy=bot-B*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=Math.max(3,B*0.09);
      ctx.lineJoin='round'; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(x+B*0.25,cy-B*0.35); ctx.lineTo(x+B*0.6,cy); ctx.lineTo(x+B*0.25,cy+B*0.35);
      ctx.stroke();
      break;
    }
    case 5: {
      const top=bot-B;
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
      ctx.strokeRect(x+2,top+2,B-4,B-4);
      ctx.strokeRect(x+B*0.25,top+B*0.25,B*0.5,B*0.5);
      break;
    }
    case 6: {   // glowing circle
      const cx=x+B/2, cy=bot-B/2;
      ctx.fillStyle='rgba(120,200,255,0.22)';
      ctx.beginPath(); ctx.arc(cx,cy,B*0.4,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(180,225,255,0.6)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(cx,cy,B*0.4,0,Math.PI*2); ctx.stroke();
      break;
    }
    case 7: {   // star
      const cx=x+B/2, cy=bot-B/2, R=B*0.42, r=B*0.18;
      ctx.fillStyle='rgba(255,235,120,0.5)';
      ctx.strokeStyle='rgba(255,245,200,0.7)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      for(let p=0;p<10;p++){ const ang=-Math.PI/2+p*Math.PI/5, rad=(p%2?r:R);
        const px=cx+Math.cos(ang)*rad, py=cy+Math.sin(ang)*rad;
        if(p===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case 8: {   // horizontal bar / pipe
      ctx.fillStyle='rgba(255,255,255,0.10)';
      ctx.fillRect(x-B*0.1, bot-B*0.62, B*1.2, B*0.24);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2;
      ctx.strokeRect(x-B*0.1, bot-B*0.62, B*1.2, B*0.24);
      break;
    }
    case 9: {   // dot grid
      ctx.fillStyle='rgba(255,255,255,0.25)';
      for(let a=0;a<3;a++) for(let c=0;c<3;c++){
        ctx.beginPath(); ctx.arc(x+B*(0.25+a*0.25), bot-B*(0.25+c*0.25), B*0.05,0,Math.PI*2); ctx.fill();
      }
      break;
    }
    case 10: {  // wavy line
      ctx.strokeStyle='rgba(150,220,255,0.5)'; ctx.lineWidth=2.5; ctx.lineCap='round';
      ctx.beginPath();
      const yc=bot-B*0.5;
      for(let p=0;p<=8;p++){ const px=x+p/8*B, py=yc+Math.sin(p/8*Math.PI*2+ftick*0.05)*B*0.18;
        if(p===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.stroke(); ctx.lineCap='butt';
      break;
    }
    case 11: {  // diamond outline
      const cx=x+B/2, cy=bot-B/2;
      ctx.strokeStyle='rgba(255,180,255,0.55)'; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(cx,cy-B*0.4); ctx.lineTo(cx+B*0.4,cy); ctx.lineTo(cx,cy+B*0.4); ctx.lineTo(cx-B*0.4,cy);
      ctx.closePath(); ctx.stroke();
      break;
    }
  }
  ctx.restore();
}
// draw decorations split by layer (0-10): z<5 behind gameplay, z>=5 in front, each sorted
function drawDecoLayer(decos, front){
  if(!decos) return;
  const arr=[];
  for(let i=0;i<decos.length;i++){
    const z=(decos[i].z!=null?decos[i].z:2);
    if(front ? z>=5 : z<5) arr.push(decos[i]);
  }
  arr.sort(function(a,b){ return (a.z!=null?a.z:2)-(b.z!=null?b.z:2); });
  for(let i=0;i<arr.length;i++) drawDecoObj(arr[i]);
}
function drawPortal(p){
  const x=(egx(p)+0.5)*B-camX;
  if(x<-80 || x>W+80) return;
  const yC=groundY-(egy(p)+1.5)*B, rh=1.6*B, rw=0.55*B;
  const col = p.m==='ship' ? '255,102,255'
            : p.m==='ball' ? '255,60,60'
            : p.m==='wave' ? '70,150,255'
            : p.m==='gdown' ? '70,150,255'
            : p.m==='gup' ? '255,225,77'
            : p.m==='ufo' ? '255,150,40'
            : '102,255,102';
  ctx.save(); ctx.translate(x,yC);
  if(p.r) ctx.rotate((p.r&3)*Math.PI/2);   // rotate tool orients the portal
  ctx.fillStyle='rgba('+col+',0.22)';
  ctx.strokeStyle='rgba('+col+',0.95)'; ctx.lineWidth=4;
  ctx.beginPath(); ctx.ellipse(0,0,rw,rh,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,0,rw*0.55,rh*0.8,0,0,Math.PI*2); ctx.stroke();
  if(p.m==='gdown' || p.m==='gup'){
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    if(p.m==='gdown'){
      ctx.moveTo(0,-rh*0.35); ctx.lineTo(0,rh*0.35);
      ctx.moveTo(-rw*0.35,rh*0.1); ctx.lineTo(0,rh*0.35); ctx.lineTo(rw*0.35,rh*0.1);
    } else {
      ctx.moveTo(0,rh*0.35); ctx.lineTo(0,-rh*0.35);
      ctx.moveTo(-rw*0.35,-rh*0.1); ctx.lineTo(0,-rh*0.35); ctx.lineTo(rw*0.35,-rh*0.1);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function drawOrb(o, used){
  const x=(egx(o)+0.5)*B-camX, y=groundY-(egy(o)+0.5)*B;
  if(x<-60 || x>W+60) return;
  const c = o.k==='p' ? '255,123,213' : o.k==='b' ? '70,150,255' : '255,225,77';
  const pul = 1+0.1*Math.sin(ftick*0.15+o.gx);
  const r = B*0.42*pul, al = used?0.25:1;
  ctx.fillStyle='rgba('+c+','+(0.18*al)+')';
  ctx.beginPath(); ctx.arc(x,y,r*1.7,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba('+c+','+(0.85*al)+')';
  ctx.strokeStyle='rgba(255,255,255,'+(0.9*al)+')'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,'+(0.7*al)+')';
  ctx.beginPath(); ctx.arc(x-r*0.25,y-r*0.3,r*0.28,0,Math.PI*2); ctx.fill();
}
function drawPad(pd){
  const x=(egx(pd)+0.5)*B-camX, gy=egy(pd);
  if(x<-60 || x>W+60) return;
  const c = pd.k==='p' ? '255,123,213' : pd.k==='b' ? '70,150,255' : '255,225,77';
  const w=B*0.74, h=B*0.18, pul=0.6+0.4*Math.abs(Math.sin(ftick*0.12+pd.gx));
  const ceil=(pd.r===1);                                  // rotated: hangs from the cell's top
  const baseY = ceil ? groundY-(gy+1)*B : groundY-gy*B;   // mount surface
  const d = ceil ? -1 : 1;                                // point down vs up
  ctx.fillStyle='rgba('+c+','+(0.22*pul)+')';
  ctx.beginPath(); ctx.ellipse(x, baseY-d*h*0.5, w*0.75, h*1.7, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba('+c+',0.95)';
  ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2; ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(x-w/2, baseY); ctx.lineTo(x-w*0.3, baseY-d*h);
  ctx.lineTo(x+w*0.3, baseY-d*h); ctx.lineTo(x+w/2, baseY);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineJoin='miter';
}
function drawStart(s, active, idx){
  const x=s.gx*B-camX, baseY=groundY-(s.gy||0)*B;
  if(x+B<0 || x>W) return;
  const top=baseY-B*1.55;
  ctx.save();
  ctx.globalAlpha = active?1:0.5;
  ctx.strokeStyle='#7CFC66'; ctx.lineWidth=active?3:2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x+3,baseY); ctx.lineTo(x+3,top); ctx.stroke();   // pole
  ctx.fillStyle = active?'#7CFC66':'rgba(124,252,102,0.7)';
  ctx.strokeStyle='#063'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(x+3,top); ctx.lineTo(x+B*0.7,top+B*0.26);
  ctx.lineTo(x+3,top+B*0.52); ctx.closePath(); ctx.fill(); ctx.stroke();       // flag
  ctx.fillStyle='#04220f'; ctx.font='bold '+Math.round(B*0.28)+'px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(''+(idx+1), x+B*0.3, top+B*0.26);
  if(active){                                                                  // spawn cell
    ctx.strokeStyle='rgba(124,252,102,0.9)'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.strokeRect(x+1, baseY-B+1, B-2, B-2); ctx.setLineDash([]);
  }
  ctx.restore();
}
function drawTrigger(t){
  // triggers use raw position - for a move trigger, t.g is the TARGET group, not its own
  const x=t.gx*B-camX, bot=groundY-(t.gy||0)*B, cx=x+B/2, cy=bot-B/2;
  if(x+B<0 || x>W) return;
  const faint = (state==='play'); // triggers are subtle in-game, clear in the editor
  ctx.save();
  ctx.globalAlpha = faint?0.4:0.95;
  if(t.type==='color'){
    const hh=((t.hue||0)%360+360)%360;
    ctx.fillStyle='hsl('+hh+',80%,55%)';
    ctx.strokeStyle='#fff'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(cx,cy-B*0.32); ctx.lineTo(cx+B*0.32,cy);
    ctx.lineTo(cx,cy+B*0.32); ctx.lineTo(cx-B*0.32,cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle='rgba(40,150,255,0.5)';
    ctx.strokeStyle='#7fd0ff'; ctx.lineWidth=2;
    ctx.fillRect(x+B*0.18, bot-B*0.82, B*0.64, B*0.64);
    ctx.strokeRect(x+B*0.18, bot-B*0.82, B*0.64, B*0.64);
    // little arrow toward the move direction
    const ang=Math.atan2(-(t.dy||0), (t.dx||0)||0.0001);
    ctx.translate(cx,cy); ctx.rotate(ang);
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(-B*0.18,0); ctx.lineTo(B*0.18,0);
    ctx.moveTo(B*0.04,-B*0.12); ctx.lineTo(B*0.18,0); ctx.lineTo(B*0.04,B*0.12);
    ctx.stroke();
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(shake>0.5) ctx.translate(0,0);
    ctx.font='bold '+Math.round(B*0.3)+'px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff'; ctx.fillText('G'+(t.g||0), cx, bot-B*0.5);
  }
  ctx.restore();
}
function drawIconShape(c, iconType, idx, s){
  idx = Math.max(0, Math.min(9, idx|0));
  const palettes=[
    ['#52e85c','#07303d','#d9ffd6'], ['#4fc3ff','#06203a','#d8f4ff'],
    ['#ff6f9d','#3a0718','#ffe1ec'], ['#ffd84a','#3a2900','#fff2a8'],
    ['#b47cff','#1d073a','#eadcff'], ['#ff7a2f','#351100','#ffe0c9'],
    ['#44f0d2','#042f2a','#d8fff9'], ['#f05cff','#340336','#ffd7ff'],
    ['#9cff4a','#173400','#edffd6'], ['#ff5050','#3a0000','#ffdada']
  ];
  const p=palettes[idx], main=p[0], dark=p[1], light=p[2];
  const h=s/2;
  c.save();
  c.lineJoin='round'; c.lineCap='round';
  if(iconType==='ship'){
    c.fillStyle=light; c.strokeStyle='#0a0f1e'; c.lineWidth=3;
    c.beginPath();
    if(idx%3===0){
      c.moveTo(-s*0.64,-s*0.04); c.quadraticCurveTo(-s*0.72,s*0.45,-s*0.12,s*0.5); c.lineTo(s*0.48,s*0.46); c.quadraticCurveTo(s*0.82,s*0.36,s*0.66,0); c.closePath();
    } else if(idx%3===1){
      c.moveTo(-s*0.66,s*0.36); c.lineTo(-s*0.18,-s*0.42); c.lineTo(s*0.7,0); c.lineTo(-s*0.18,s*0.42); c.closePath();
    } else {
      c.moveTo(-s*0.62,0); c.lineTo(-s*0.2,-s*0.42); c.lineTo(s*0.66,-s*0.12); c.lineTo(s*0.66,s*0.12); c.lineTo(-s*0.2,s*0.42); c.closePath();
    }
    c.fill(); c.stroke();
    c.fillStyle=main; c.fillRect(-s*0.48, s*0.15, s*0.96, s*0.12);
    c.fillStyle=main; c.beginPath(); c.moveTo(-s*0.64,0); c.lineTo(-s*0.9,-s*0.16); c.lineTo(-s*0.9,s*0.16); c.closePath(); c.fill();
  } else if(iconType==='wave'){
    const w=s*0.58;
    c.fillStyle=main; c.strokeStyle=dark; c.lineWidth=3;
    c.beginPath();
    c.moveTo(w*0.86,0); c.lineTo(-w*0.62,-w*(0.55+idx%3*0.08)); c.lineTo(-w*0.2,0); c.lineTo(-w*0.62,w*(0.55+idx%3*0.08));
    c.closePath(); c.fill(); c.stroke();
    c.strokeStyle=light; c.lineWidth=2;
    c.beginPath(); c.moveTo(-w*0.36,-w*0.24); c.lineTo(w*0.42,0); c.lineTo(-w*0.36,w*0.24); c.stroke();
    if(idx>4){ c.fillStyle=dark; c.beginPath(); c.arc(-w*0.38,0,w*0.12,0,Math.PI*2); c.fill(); }
  } else if(iconType==='ball'){
    const rad=h;
    c.fillStyle=main; c.strokeStyle=dark; c.lineWidth=3;
    c.beginPath(); c.arc(0,0,rad,0,Math.PI*2); c.fill(); c.stroke();
    c.strokeStyle=light; c.lineWidth=2;
    if(idx%3===0){ c.beginPath(); c.arc(0,0,rad*0.62,0,Math.PI*2); c.stroke(); }
    else if(idx%3===1){ c.beginPath(); c.moveTo(-rad*0.7,0); c.lineTo(rad*0.7,0); c.moveTo(0,-rad*0.7); c.lineTo(0,rad*0.7); c.stroke(); }
    else { for(let a=0;a<Math.PI*2;a+=Math.PI/3){ c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(a)*rad*0.72,Math.sin(a)*rad*0.72); c.stroke(); } }
    c.fillStyle=dark; c.beginPath(); c.moveTo(0,0); c.arc(0,0,rad*0.56,-0.55+idx*0.08,0.55+idx*0.08); c.closePath(); c.fill();
  } else {
    c.fillStyle=main; c.strokeStyle='#06140a'; c.lineWidth=3;
    c.beginPath();
    if(c.roundRect) c.roundRect(-h,-h,s,s,idx%2?9:5); else c.rect(-h,-h,s,s);
    c.fill(); c.stroke();
    c.strokeStyle=light; c.lineWidth=2;
    if(idx%3===0) c.strokeRect(-h+5,-h+5,s-10,s-10);
    else if(idx%3===1){ c.beginPath(); c.moveTo(-h+7,-h+7); c.lineTo(h-7,h-7); c.moveTo(h-7,-h+7); c.lineTo(-h+7,h-7); c.stroke(); }
    else { c.beginPath(); c.arc(0,0,s*0.28,0,Math.PI*2); c.stroke(); }
    c.fillStyle=dark;
    if(idx<5){
      c.fillRect(-s*0.28,-s*0.30, s*0.16, s*0.30); c.fillRect(s*0.12,-s*0.30, s*0.16, s*0.30);
      c.fillRect(-s*0.21, s*0.12, s*0.42, s*0.14);
    } else {
      c.beginPath(); c.arc(-s*0.18,-s*0.18,s*0.08,0,Math.PI*2); c.arc(s*0.18,-s*0.18,s*0.08,0,Math.PI*2); c.fill();
      c.beginPath(); c.moveTo(-s*0.22,s*0.18); c.lineTo(-s*0.07,s*0.05); c.lineTo(s*0.07,s*0.18); c.lineTo(s*0.22,s*0.05); c.strokeStyle=dark; c.lineWidth=3; c.stroke();
    }
  }
  c.restore();
}
function drawCubeBody(s){
  drawIconShape(ctx, 'cube', selectedIcons.cube, s);
}
// flying saucer: the player's cube icon rides on top as the cockpit dome
function drawUfoBody(s){
  ctx.save();
  ctx.translate(0,-s*0.16); ctx.scale(0.62,0.62);
  drawIconShape(ctx, 'cube', selectedIcons.cube, s);
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, s*0.20, s*0.58, s*0.22, 0, 0, Math.PI*2);
  ctx.fillStyle='#cfd8e6'; ctx.strokeStyle='#0a0f1e'; ctx.lineWidth=3;
  ctx.fill(); ctx.stroke();
  ctx.fillStyle='#ff9628';
  [-0.34,0,0.34].forEach(function(fx){
    ctx.beginPath(); ctx.arc(fx*s, s*0.20, s*0.055, 0, Math.PI*2); ctx.fill();
  });
}
function drawPlayer(){
  ctx.save();
  ctx.translate(P.x-camX+B/2, P.y+B/2);
  ctx.rotate(P.rot);
  ctx.scale(1, gdir);
  const s=B-4;
  if(mode==='ship'){
    drawIconShape(ctx, 'ship', selectedIcons.ship, s);
    ctx.save();
    ctx.translate(0,-s*0.18);
    ctx.scale(0.55,0.55);
    drawIconShape(ctx, 'cube', selectedIcons.cube, s);
    ctx.restore();
  } else if(mode==='ufo'){
    drawUfoBody(s);
  } else {
    drawIconShape(ctx, mode, selectedIcons[mode]||0, s);
  }
  ctx.restore();
}
function renderGame(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(shake>0.5){
    ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);
    shake*=0.86;
  } else shake=0;
  pulse*=0.93;
  if(AC){
    while(kickTimes.length && kickTimes[0] <= AC.currentTime){
      pulse=1; kickTimes.shift();
    }
  }
  const hue=(bgHueCur + P.x/(B*3)) % 360;

  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'hsl('+hue+',70%,'+(30+pulse*8)+'%)');
  g.addColorStop(1,'hsl('+hue+',80%,'+(12+pulse*4)+'%)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  drawDeco(hue);

  const ps=B*4, off=-((camX*0.4)%(ps*2));
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=2;
  for(let x=off-ps*2; x<W+ps; x+=ps*2)
    for(let y=H*0.08; y<groundY-ps; y+=ps*1.6)
      ctx.strokeRect(x,y,ps,ps);

  ctx.fillStyle='hsl('+hue+',55%,'+(20+pulse*5)+'%)';
  ctx.fillRect(0,groundY,W,H-groundY);
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1.5;
  for(let x=-(camX%B); x<W; x+=B) line(x,groundY,x,H);
  drawGroundDeco();
  ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(0,groundY-2,W,3);

  if(shipAnim>0.02){
    const cy=ceilingY();
    ctx.globalAlpha=shipAnim;
    ctx.fillStyle='hsl('+hue+',55%,'+(20+pulse*5)+'%)';
    ctx.fillRect(0,0,W,Math.max(0,cy));
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.fillRect(0,cy-1,W,3);
    ctx.globalAlpha=1;
  }
  // inverted gravity: mark the ceiling as the walk surface (no animated overlay)
  if(gdir<0){
    const cy=ceilingY();
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.fillRect(0,cy-2,W,3);
  }

  const ex=curL.endX*B-camX;
  if(ex>-60 && ex<W+60){
    ctx.save();
    ctx.shadowColor='#fff'; ctx.shadowBlur=18;
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillRect(ex,0,5,groundY);
    ctx.restore();
  }

  objColorCur = curL.oc || '255,255,255';
  drawDecoLayer(curL.decos, false);
  if(curL.slopes) for(let i=0;i<curL.slopes.length;i++) drawSlope(curL.slopes[i]);
  for(let i=0;i<curL.speeds.length;i++) drawSpeed(curL.speeds[i]);
  for(let i=0;i<curL.portals.length;i++) drawPortal(curL.portals[i]);
  for(let i=0;i<curL.blocks.length;i++) drawBlock(curL.blocks[i]);
  for(let i=0;i<curL.spikes.length;i++) drawSpike(curL.spikes[i]);
  if(curL.saws) for(let i=0;i<curL.saws.length;i++) drawSaw(curL.saws[i]);
  if(curL.pads) for(let i=0;i<curL.pads.length;i++) drawPad(curL.pads[i]);
  if(curL.orbs) for(let i=0;i<curL.orbs.length;i++) drawOrb(curL.orbs[i], orbUsed[i]);
  if(curL.triggers) for(let i=0;i<curL.triggers.length;i++) drawTrigger(curL.triggers[i]);
  drawDecoLayer(curL.decos, true);

  if(state==='play'){
    const ax=3*B-camX;
    if(ax>-400 && ax<W){
      ctx.font='900 '+Math.round(B*0.62)+'px "Arial Black",Arial';
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.lineWidth=5; ctx.strokeStyle='rgba(0,0,0,0.6)';
      ctx.strokeText('Attempt '+attempts, ax, groundY-3.2*B);
      ctx.fillStyle='#fff';
      ctx.fillText('Attempt '+attempts, ax, groundY-3.2*B);
    }
  }

  if(!P.dead) drawPlayer();

  if(P.dead){
    const r=deadT*B*0.14, a=Math.max(0,1-deadT/28);
    ctx.strokeStyle='rgba(255,255,255,'+a+')'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.arc(deathX-camX,deathY,r,0,Math.PI*2); ctx.stroke();
  }

  for(let i=0;i<particles.length;i++){
    const p=particles[i], a=p.life/p.max;
    ctx.fillStyle='rgba('+p.col+','+a+')';
    ctx.fillRect(p.x-camX-p.size/2, p.y-p.size/2, p.size, p.size);
  }

  drawDust();

  if(state==='play'){
    const pw=Math.min(W*0.5,420), px0=(W-pw)/2;
    const pct=Math.max(0,Math.min(100, P.x/(curL.endX*B)*100));
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(px0,12,pw,10);
    ctx.fillStyle='#6cff5c'; ctx.fillRect(px0+1,13,(pw-2)*pct/100,8);
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1.5;
    ctx.strokeRect(px0,12,pw,10);
    ctx.font='bold 13px Arial'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff';
    ctx.fillText(Math.floor(pct)+'%', px0+pw+10, 17);
    ctx.font='bold 12px Arial';
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText(curL.name + (playCtx.type==='test'?' (TEST)':''), px0, 34);
  }
}
function renderEditor(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  camX = edCamX;
  const hue=215;
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'hsl('+hue+',45%,24%)');
  g.addColorStop(1,'hsl('+hue+',55%,10%)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  ctx.fillStyle='hsl('+hue+',40%,16%)';
  ctx.fillRect(0,groundY,W,H-groundY);
  ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(0,groundY-2,W,3);

  // grid
  ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1;
  for(let x=-(camX%B); x<W; x+=B) line(x, groundY-9*B, x, H);
  for(let j=0;j<=9;j++) line(0, groundY-j*B, W, groundY-j*B);
  // ceiling guide (ship corridors)
  ctx.strokeStyle='rgba(255,102,255,0.4)'; ctx.lineWidth=2;
  ctx.setLineDash([8,8]); line(0, groundY-9*B, W, groundY-9*B); ctx.setLineDash([]);

  // start + end markers
  const sx0=0-camX;
  if(sx0>-10 && sx0<W){
    ctx.fillStyle='rgba(108,255,92,0.7)'; ctx.fillRect(sx0,groundY-9*B,4,9*B);
    ctx.font='bold 12px Arial'; ctx.fillStyle='#9f9';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('START', sx0+8, groundY-9*B+16);
  }
  const endX=maxGx(ED)+10, exx=endX*B-camX;
  if(exx>-10 && exx<W+10){
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillRect(exx,groundY-9*B,4,9*B);
    ctx.font='bold 12px Arial'; ctx.fillStyle='#fff';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('END', exx+8, groundY-9*B+16);
  }

  objColorCur = ED.oc || '255,255,255';
  drawDecoLayer(ED.decos, false);
  for(let i=0;i<ED.slopes.length;i++) drawSlope(ED.slopes[i]);
  for(let i=0;i<ED.speeds.length;i++) drawSpeed(ED.speeds[i]);
  for(let i=0;i<ED.portals.length;i++) drawPortal(ED.portals[i]);
  for(let i=0;i<ED.blocks.length;i++) drawBlock(ED.blocks[i]);
  for(let i=0;i<ED.spikes.length;i++) drawSpike(ED.spikes[i]);
  for(let i=0;i<ED.saws.length;i++) drawSaw(ED.saws[i]);
  for(let i=0;i<ED.pads.length;i++) drawPad(ED.pads[i]);
  for(let i=0;i<ED.orbs.length;i++) drawOrb(ED.orbs[i], false);
  for(let i=0;i<ED.triggers.length;i++) drawTrigger(ED.triggers[i]);
  drawDecoLayer(ED.decos, true);
  if(ED.starts) for(let i=0;i<ED.starts.length;i++) drawStart(ED.starts[i], i===activeStart, i);
  drawSelection();

  // ghost player at spawn
  ctx.globalAlpha=0.45;
  const gx0=0-camX+B/2, gy0=groundY-B/2;
  ctx.save(); ctx.translate(gx0,gy0); drawCubeBody(B-4); ctx.restore();
  ctx.globalAlpha=1;

  // selection highlight
  if(selA!==null && edHover){
    const c=cellAt(edHover.x, edHover.y);
    const a=Math.min(selA,c.gx), b=Math.max(selA,c.gx);
    ctx.fillStyle='rgba(255,225,77,0.15)';
    ctx.fillRect(a*B-camX, groundY-9*B, (b-a+1)*B, 9*B);
    ctx.strokeStyle='rgba(255,225,77,0.8)'; ctx.lineWidth=2;
    ctx.strokeRect(a*B-camX, groundY-9*B, (b-a+1)*B, 9*B);
  }
  // hover cell
  if(edHover && edTool!=='move'){
    const c=cellAt(edHover.x, edHover.y);
    if(c.gy>=0 && c.gy<=8){
      ctx.strokeStyle='rgba(255,255,255,0.65)'; ctx.lineWidth=2;
      ctx.strokeRect(c.gx*B-camX, groundY-(c.gy+1)*B, B, B);
    }
  }
}
function render(){
  if(state==='edit'){ renderEditor(); return; }
  renderGame();
}

// ---------- main loop ----------
let last=0, acc=0;
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min(50, t-last); last=t;
  if(paused){ acc=0; render(); return; }
  acc+=dt;
  while(acc >= 1000/60){ step(); acc -= 1000/60; }
  render();
}
resize();
setTrack(0);
reset();
showMain();
requestAnimationFrame(loop);






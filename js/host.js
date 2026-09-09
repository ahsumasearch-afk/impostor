/* Host-Logik: Der Host ist der Spielserver und haelt den Zustand. */

function freshState(){
  return {phase:"lobby",round:0,players:[],mainQuestion:"",impostorId:null,
          tally:{},topIds:[],caught:false,chat:[],kicked:[],
          tAnswer:0,tTalk:0,tVote:0,deadline:0,used:[]};
}
const GRACE=18000;   // Reserve fuer stille Faelle
const QUICK=4000;    // abgemeldet oder Herzschlag ausgeblieben: nur kurz auf Rueckkehr warten
const BEAT=2500;     // so oft meldet sich jeder Spieler beim Host
const DEAD=6500;     // so lange Stille, dann gilt jemand als weg
const HOSTDEAD=14000;// so lange Stille vom Host, dann versucht der Client neu zu verbinden
const hp=pid=>H.players.find(p=>p.pid===pid);
const active=()=>H.players.filter(p=>p.online&&!p.waiting);
const inRound=()=>H.players.filter(p=>!p.waiting);
/* Wer die Runde blockiert: alle Mitspieler, die online sind oder gerade erst
   weggefallen sind (z.B. weil sie neu laden). Wer laenger weg ist, wird uebergangen. */
const blockers=()=>inRound().filter(p=>p.online||Date.now()-(p.offSince||0)<(p.quick?QUICK:GRACE));
let graceTimer=null;
function armGrace(ms){
  clearTimeout(graceTimer);
  graceTimer=setTimeout(()=>{ if(!H) return; checkAnswers(); checkVotes(); broadcast(); },ms);
}

function saveHost(){
  if(!H||!roomCode) return;
  LS.set("fi_host",{code:roomCode,ts:Date.now(),owner:myPid,
    state:{...H,players:H.players.map(p=>({...p,connId:null,online:false}))}});
}
function sendTo(p,msg){ const c=p.connId&&conns[p.connId]; if(c&&c.open){ try{c.send(msg);}catch(_){} } }

function hostJoin(connId,pid,name,emoji,color){
  if(H.kicked.includes(pid)){
    const c=conns[connId]; if(c&&c.open) c.send({t:"denied"});
    return;
  }
  let p=hp(pid);
  if(p){                                   // Wiederkehrer: alles bleibt erhalten
    p.connId=connId; p.online=true; p.offSince=0; p.quick=false; p.lastSeen=Date.now();
    if(name) p.name=uniqueName(name,pid);
    if(emoji) p.emoji=emoji;
    if(color===0||color) p.color=color;
  }else{
    p={pid,name:uniqueName(name||"Spieler",pid),emoji:emoji||"",color:(color===0||color)?color:null,score:0,answer:null,vote:null,question:"",
       online:true,connId,lastSeen:Date.now(),waiting:H.phase!=="lobby"};
    H.players.push(p);
  }
  broadcast();
}
function uniqueName(n,pid){
  n=String(n).trim().slice(0,16)||"Spieler";
  const taken=H.players.filter(p=>p.pid!==pid).map(p=>p.name.toLowerCase());
  if(!taken.includes(n.toLowerCase())) return n;
  for(let i=2;i<40;i++) if(!taken.includes((n+" "+i).toLowerCase())) return n+" "+i;
  return n;
}
function hostOffline(connId){
  const p=H.players.find(x=>x.connId===connId);
  delete conns[connId];
  if(!p) return;
  // Wer sich abgemeldet hat (Tab geschlossen/neu geladen), haelt die Runde nur kurz auf.
  const saidBye=p.quick&&Date.now()-(p.offSince||0)<3000;
  p.online=false; p.connId=null;                 // NICHT entfernen – Punkte bleiben erhalten
  if(!saidBye){ p.quick=false; p.offSince=Date.now(); }
  armGrace(saidBye?QUICK+400:GRACE+500); broadcast();
}
function hostKick(pid){
  const p=hp(pid); if(!p||pid===myPid) return;
  H.kicked.push(pid);
  sendTo(p,{t:"kick"});
  const c=p.connId&&conns[p.connId];
  H.players=H.players.filter(x=>x.pid!==pid);
  setTimeout(()=>{ try{c&&c.close();}catch(_){} },300);
  checkAnswers(); checkVotes(); broadcast();
}
/* Zieht ein Fragenpaar ohne Zuruecklegen: Erst wenn alle Paare durch sind,
   faengt der Vorrat von vorn an. So kommt an einem Abend nichts doppelt. */
function ziehePaar(){
  if(!H.used||H.used.length>=PAIRS.length) H.used=[];
  let i;
  do { i=(Math.random()*PAIRS.length)|0; } while(H.used.indexOf(i)>=0);
  H.used.push(i);
  return PAIRS[i];
}
/* Verteilt eine frische Frage in der laufenden Runde – auch fuer den Skip-Knopf. */
function neueFrage(){
  const act=H.players.filter(p=>p.online);
  if(!act.length) return;
  const pair=ziehePaar(), flip=Math.random()<.5;
  const main=flip?pair[1]:pair[0], other=flip?pair[0]:pair[1];
  const imp=act[(Math.random()*act.length)|0];
  H.mainQuestion=main; H.impostorId=imp.pid;
  H.tally={}; H.topIds=[]; H.caught=false;
  clearTimeout(graceTimer);
  H.players.forEach(p=>{ p.answer=null; p.vote=null;
    p.waiting=!p.online;                       // wer gerade weg ist, sitzt die Runde aus
    p.question=(p.pid===imp.pid)?other:main; });
  setDeadline("answer");
}
function hostStartRound(){
  if(H.players.filter(p=>p.online).length<3) return;
  H.round++; H.phase="answer"; neueFrage(); broadcast();
}
/* Setzt die Uhr fuer die neue Phase – 0 heisst: ohne Zeitlimit. */
function setDeadline(phase){
  const sec=phase==="answer"?H.tAnswer:phase==="reveal"?H.tTalk:phase==="vote"?H.tVote:0;
  H.deadline=sec?Date.now()+sec*1000:0;
}
function checkAnswers(force){
  if(H.phase!=="answer") return;
  const b=force?active():blockers();
  if(b.length>=2&&b.every(p=>p.answer!=null)){ H.phase="reveal"; setDeadline("reveal"); }
}
function checkVotes(force){
  if(H.phase!=="vote") return;
  const b=force?active():blockers();
  if(!(b.length>=2&&b.every(p=>p.vote!=null))) return;
  finishVotes();
}
/* Teamwertung: Entweder gewinnt die Gruppe gemeinsam oder der Luegner allein.
   Der einzelne richtige Tipp bringt nichts, wenn die Mehrheit danebenliegt. */
function finishVotes(){
  const voters=inRound().filter(p=>p.vote!=null);
  const t={}; voters.forEach(p=>{ t[p.vote]=(t[p.vote]||0)+1; });
  const werte=Object.values(t);
  const max=werte.length?Math.max(...werte):0;
  const tops=Object.keys(t).filter(k=>t[k]===max);
  H.tally=t; H.topIds=tops;
  H.caught=tops.length===1&&tops[0]===H.impostorId;
  if(H.caught) inRound().forEach(p=>{ if(p.pid!==H.impostorId) p.score+=1; });
  else { const i=hp(H.impostorId); if(i) i.score+=1; }
  H.phase="result"; H.deadline=0;
}
function hostChat(pid,text){
  const p=hp(pid); if(!p) return;
  text=String(text||"").trim().slice(0,300); if(!text) return;
  H.chat.push({id:uid(),pid,name:p.name,text,ts:Date.now()});
  if(H.chat.length>120) H.chat=H.chat.slice(-120);
  broadcast();
}
/* Der Host prueft regelmaessig, wer sich nicht mehr meldet – auf das close-Ereignis
   von WebRTC ist kein Verlass, wenn jemand einfach den Tab zumacht. */
let sweepTimer=null,beatCount=0;
function hostSweep(){
  if(!H) return;
  let changed=false;
  H.players.forEach(p=>{
    if(p.pid===myPid){ p.online=true; p.lastSeen=Date.now(); return; }
    if(p.online&&Date.now()-(p.lastSeen||0)>DEAD){
      p.online=false; p.quick=true; p.offSince=Date.now(); changed=true;
    }
  });
  if(H.deadline&&Date.now()>H.deadline){                      // Zeit ist um
    if(H.phase==="answer"){ H.phase="reveal"; setDeadline("reveal"); broadcast(); return; }
    if(H.phase==="reveal"){ H.phase="vote";   setDeadline("vote");   broadcast(); return; }
    if(H.phase==="vote"){   finishVotes();                            broadcast(); return; }
    H.deadline=0;
  }
  const before=H.phase;
  checkAnswers(); checkVotes();
  if(changed||H.phase!==before){ broadcast(); return; }
  if(++beatCount%3===0) Object.values(conns).forEach(c=>{ if(c.open){ try{c.send({t:"hb"});}catch(_){} } });
}
function publicState(){
  const show=H.phase==="reveal"||H.phase==="vote"||H.phase==="result";
  return {
    phase:H.phase,round:H.round,code:roomCode,hostId:myPid,
    mainQuestion:H.phase==="answer"?"":H.mainQuestion,
    impostorId:H.phase==="result"?H.impostorId:null,
    impostorQuestion:H.phase==="result"?((hp(H.impostorId)||{}).question||""):"",
    tally:H.tally,topIds:H.topIds,caught:H.caught,chat:H.chat,
    tAnswer:H.tAnswer||0, tTalk:H.tTalk||0, tVote:H.tVote||0, deadline:H.deadline||0,
    players:H.players.map(p=>({
      pid:p.pid,name:p.name,emoji:p.emoji||"",color:(p.color===0||p.color)?p.color:null,score:p.score,online:p.online,waiting:!!p.waiting,
      answered:p.answer!=null,voted:p.vote!=null,
      answer:show?p.answer:null,vote:H.phase==="result"?p.vote:null
    }))
  };
}
function broadcast(){
  const s=publicState();
  H.players.forEach(p=>{
    if(p.pid===myPid){ S=s; myQuestion=p.question; return; }
    sendTo(p,{t:"state",s,q:p.question});
  });
  saveHost(); render();
}
function hostHandle(connId,pid,msg){
  if(!H||!msg) return;
  if(msg.t==="join"){ hostJoin(connId,msg.pid,msg.name,msg.emoji,msg.color); return; }
  const p=hp(pid); if(!p) return;
  p.lastSeen=Date.now();
  if(msg.t==="ping"){                       // Herzschlag: zurueck aus kurzer Stille
    if(!p.online){ p.online=true; p.quick=false; p.offSince=0; if(connId) p.connId=connId; broadcast(); }
    return;
  }
  switch(msg.t){
    case "answer":
      if(H.phase!=="answer"||p.waiting) return;
      p.answer=String(msg.text||"").trim().slice(0,80)||"—";
      checkAnswers(); broadcast(); return;
    case "vote":
      if(H.phase!=="vote"||p.waiting||msg.target===pid||!hp(msg.target)) return;
      p.vote=msg.target; checkVotes(); broadcast(); return;
    case "chat": hostChat(pid,msg.text); return;
    case "bye":                                   // Spieler verlaesst die Seite
      p.online=false; p.quick=true; p.offSince=Date.now();
      armGrace(QUICK+400); broadcast(); return;
    case "force":                                 // Host: ohne die Abwesenden weiter
      if(pid===myPid){ checkAnswers(true); checkVotes(true); broadcast(); } return;
    case "start":  if(pid===myPid&&H.phase==="lobby") hostStartRound(); return;
    case "skip":                                  // Host ueberspringt die aktuelle Frage
      if(pid===myPid&&H.phase==="answer"){ neueFrage(); broadcast(); } return;
    case "skin":                                  // Emoji/Farbe im Warteraum aendern
      if(msg.emoji!==undefined) p.emoji=String(msg.emoji||"").slice(0,8);
      if(msg.color===null||typeof msg.color==="number") p.color=msg.color;
      broadcast(); return;
    case "tovote": if(pid===myPid&&H.phase==="reveal"){H.phase="vote";setDeadline("vote");broadcast();} return;
    case "next":   if(pid===myPid&&H.phase==="result") hostStartRound(); return;
    case "lobby":  if(pid===myPid){H.phase="lobby";H.deadline=0;broadcast();} return;
    case "kick":   if(pid===myPid&&H.phase==="lobby") hostKick(msg.pid); return;
    case "timer":                                 // Zeiten einstellen (nur Host, nur im Warteraum)
      if(pid===myPid&&H.phase==="lobby"&&typeof msg.sec==="number"&&msg.sec>=0&&msg.sec<=3600){
        if(msg.which==="answer") H.tAnswer=msg.sec;
        else if(msg.which==="talk") H.tTalk=msg.sec;
        else if(msg.which==="vote") H.tVote=msg.sec;
        broadcast();
      }
      return;
    case "leave":                                 // Spieler verlaesst den Raum freiwillig
      H.players=H.players.filter(x=>x.pid!==pid);
      checkAnswers(); checkVotes(); broadcast(); return;
  }
}
function act(msg){
  if(isHost) hostHandle(null,myPid,msg);
  else if(hostConn&&hostConn.open){ try{hostConn.send(msg);}catch(_){} }
}

/* Grundlagen: Speicher, Identitaet, Hilfsfunktionen, gemeinsamer Zustand. */

const ALPHA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", PREFIX="fragimp-";
const MAXAGE=6*3600*1000;
const app=document.getElementById("app");
const el=i=>document.getElementById(i);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const genCode=()=>Array.from({length:4},()=>ALPHA[(Math.random()*ALPHA.length)|0]).join("");
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const LS={
  get(k,d){ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(_){return d;} },
  set(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch(_){} },
  del(k){ try{localStorage.removeItem(k);}catch(_){} },
  /* Nur loeschen, was diesem Tab gehoert – mehrere Tabs teilen sich den Speicher. */
  delMine(k){ const o=this.get(k,null); if(o&&o.owner&&o.owner!==myPid) return; this.del(k); }
};
const EMOJIS=[
  "🐰","🦊","🐼","🐸","🐙","🦉","🐝","🦄","🐺","🦁","🐨","🦈","🐢","🐧","🦋","🐷",
  "🐮","🐹","🐔","🦆","🦅","🦇","🐗","🦝","🦡","🦦","🦥","🦩","🦜","🐬","🐳","🦭",
  "🦖","🦕","🐉","🦂","🕷️","🐌","🦀","🐡","🦑","🐍","🦎","🐊","🦔","🐴","🦒","🐘",
  "👽","🤖","👻","🎃","💀","☠️","🥷","🧙","🧛","🧜","🧟","🤡","🤠","🕶️","🎩","👑",
  "🍕","🌮","🍄","🍩","🍔","🌭","🍟","🍿","🍦","🍪","🥑","🍉","🍒","🌶️","🥕","☕",
  "🍺","🧃","🎸","🎮","🎲","🃏","🚀","🛸","⚽","🏀","🎯","🧠","👁️","🦷","💎","🔮",
  "⚡","🔥","🌵","🌙","🌈","⭐","❄️","🌊","🪐","🧲","🎪","🍀"];
const FARBEN=[265,285,320,340,0,18,35,50,80,140,165,190,210,235];   // Farbtoene
let myEmoji=LS.get("fi_emoji","")||"";
let myColor=LS.get("fi_color",null);
const farbeVon=p=>(p.color===0||p.color)?p.color:hue(p.pid||p.name||"x");
function hue(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360; return h; }
function avatar(p,cls){
  const h=farbeVon(p);
  const off=(p.online===false)?" off":"";
  if(p.emoji) return `<span class="av emo${off}${cls?" "+cls:""}" style="background:linear-gradient(140deg,hsl(${h} 55% 30%),hsl(${(h+42)%360} 55% 20%))">${p.emoji}</span>`;
  return `<span class="av${off}${cls?" "+cls:""}" style="background:linear-gradient(140deg,hsl(${h} 82% 68%),hsl(${(h+42)%360} 82% 58%))">${esc((p.name||"?").trim().charAt(0).toUpperCase())}</span>`;
}

/* Eigene Identität. Überlebt Neuladen (sessionStorage bleibt im Tab bestehen),
   ist aber pro Tab eigen – so kann man auf einem Rechner zu dritt testen.
   Ein frisch geöffneter Tab übernimmt die gespeicherte Identität nur dann,
   wenn sie gerade kein anderer Tab benutzt (Heartbeat). */
const SS={
  get(k){ try{return sessionStorage.getItem(k);}catch(_){return null;} },
  set(k,v){ try{sessionStorage.setItem(k,v);}catch(_){} }
};
let myPid=SS.get("fi_pid");
if(!myPid){
  const base=LS.get("fi_pid",null), claim=LS.get("fi_pid_claim",0);
  if(base&&Date.now()-claim>8000){ myPid=base; }
  else { myPid=uid(); if(!base) LS.set("fi_pid",myPid); }
  SS.set("fi_pid",myPid);
}
if(myPid===LS.get("fi_pid",null)) LS.set("fi_pid_claim",Date.now());
setInterval(()=>{ if(myPid===LS.get("fi_pid",null)) LS.set("fi_pid_claim",Date.now()); },3000);

/* ============================ Zustand ============================ */
let peer=null,isHost=false,roomCode="",myName="";
let conns={};            // Host: connId -> DataConnection
let hostConn=null;       // Client: Verbindung zum Host
let S=null;              // öffentlich sichtbarer Zustand
let H=null;              // Host: vollständiger Zustand
let myQuestion="";
let screen="start";      // start | invite | connecting | game | error | kicked
let errMsg="",banner="";
let draftAnswer="",draftChat="",chatOpen=LS.get("fi_chatopen",true),chatSeen=0;
let retryTimer=null,retries=0;

const url=new URL(location.href);
const rawInvite=(url.searchParams.get("r")||"").toUpperCase();
let inviteCode=/^[A-Z0-9]{4}$/.test(rawInvite)?rawInvite:"";

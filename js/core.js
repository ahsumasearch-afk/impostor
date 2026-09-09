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
  "🐒","🦍","🦧","🐆","🐅","🐄","🐖","🐑","🐐","🦙","🦌","🦫","🐿️","🦨","🦘","🐇",
  "🦃","🦚","🕊️","🦢","🐓","🐋","🦞","🦐","🦪","🐠","🐟","🐚","🦠","👽","🤖","👻",
  "🎃","💀","☠️","🥷","🧙","🧛","🧜","🧟","🤡","🤠","🕶️","🎩","👑","🧑‍🚀","🧑‍🎤","🧑‍🍳",
  "🧑‍🔧","🧑‍🚒","🕵️","💂","🥸","🦸","🦹","🧚","🧞","🧝","👮","👷","🤴","🍕","🌮","🍄",
  "🍩","🍔","🌭","🍟","🍿","🍦","🍪","🥑","🍉","🍒","🌶️","🥕","☕","🍺","🧃","🍫",
  "🍰","🥐","🥨","🧀","🥞","🍣","🍜","🍇","🍌","🍍","🥥","🍑","🥝","⚽","🏀","🏈",
  "🎾","🏐","🥊","🏓","🏸","⛳","🎿","🏂","🛹","🚴","🏋️","🤸","🏆","🎸","🎹","🎺",
  "🎻","🥁","🎧","🎤","🎬","🎮","🕹️","🎲","🃏","🎯","🎳","🪁","🧩","🚀","🛸","✈️",
  "🚁","🚂","🚗","🏎️","🛵","🚲","⛵","🛶","🚜","🚌","🛻","🏍️","🚓","🌈","⭐","🌙",
  "☀️","⚡","🔥","❄️","🌊","🌵","🌴","🌻","🌸","🍀","🍁","🌍","🪐","💎","🔮","🧲",
  "🎁","🎈","🎉","🧸","🪄","🔑","🗝️","💡","🕯️","📚","🖌️","🧭","⚓","🦓","🦛","🐪",
  "🐜","🦗","🍋","🍅","🥦","🧁","🍭","🥤","🏹","🥇","🎪","🪩"
];
const FARBEN=[265,285,310,330,350,10,25,40,55,85,120,155,180,200,220,245];  // Farbtoene
/* Umrechnung fuer den freien Farbwaehler: Wir speichern nur den Farbton,
   damit Avatare ueberall dieselbe kraeftige Abstufung bekommen. */
function hexZuHue(hex){
  const r=parseInt(hex.substr(1,2),16)/255, g=parseInt(hex.substr(3,2),16)/255, b=parseInt(hex.substr(5,2),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  if(!d) return 0;
  let h;
  if(max===r) h=((g-b)/d)%6; else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4;
  h=Math.round(h*60); return h<0?h+360:h;
}
function hueZuHex(h,s,l){
  s=(s===undefined)?.95:s; l=(l===undefined)?.6:l;
  const a=s*Math.min(l,1-l);
  const f=n=>{
    const k=(n+h/30)%12;
    const c=l-a*Math.max(-1,Math.min(k-3,Math.min(9-k,1)));
    return Math.round(255*c).toString(16).padStart(2,"0");
  };
  return "#"+f(0)+f(8)+f(4);
}

let myEmoji=LS.get("fi_emoji","")||"";
let myColor=LS.get("fi_color",null);
const farbeVon=p=>(p.color===0||p.color)?p.color:hue(p.pid||p.name||"x");
function hue(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360; return h; }
function avatar(p,cls){
  const h=farbeVon(p);
  const off=(p.online===false)?" off":"";
  if(p.emoji) return `<span class="av emo${off}${cls?" "+cls:""}" style="background:linear-gradient(140deg,hsl(${h} 85% 52%),hsl(${(h+40)%360} 85% 38%))">${p.emoji}</span>`;
  return `<span class="av${off}${cls?" "+cls:""}" style="background:linear-gradient(140deg,hsl(${h} 90% 66%),hsl(${(h+40)%360} 90% 52%))">${esc((p.name||"?").trim().charAt(0).toUpperCase())}</span>`;
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
let skinOpen=LS.get("fi_skinopen",false);
let offeneKarten=LS.get("fi_offen",null)||{kat:false,zeit:false,skin:false,notif:false};
let copiedUntil=0;                 /* zeigt kurz "Link kopiert" in der Raum-Pille */

/* Kopiert Text in die Zwischenablage. Die moderne Schnittstelle verlangt einen
   sicheren Kontext und eine echte Nutzergeste; klappt sie nicht, wird der aeltere
   Weg ueber ein verstecktes Textfeld versucht. */
async function inZwischenablage(text){
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(text);
      return true;
    }
  }catch(_){}
  try{
    const t=document.createElement("textarea");
    t.value=text; t.setAttribute("readonly","");
    t.style.cssText="position:fixed;top:-1000px;left:0;opacity:0";
    document.body.appendChild(t);
    t.select(); t.setSelectionRange(0,text.length);
    const ok=document.execCommand("copy");
    t.remove();
    return ok;
  }catch(_){ return false; }
}
let retryTimer=null,retries=0;

const url=new URL(location.href);
const rawInvite=(url.searchParams.get("r")||"").toUpperCase();
let inviteCode=/^[A-Z0-9]{4}$/.test(rawInvite)?rawInvite:"";

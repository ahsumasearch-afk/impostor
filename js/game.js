/* Die Spielbildschirme. */

/* ---------- Spielbildschirme ---------- */
function topbar(){
  const unread=Math.max(0,(S.chat||[]).length-chatSeen);
  const steps=["answer","reveal","vote","result"];
  const idx=steps.indexOf(S.phase);
  return `<div class="chips">
    <span class="chip code btn" id="codechip" title="Einladungslink kopieren">${
      Date.now()<copiedUntil
        ? `<span class="ok">Link kopiert ✓</span>`
        : `<span class="cl">Raum</span> <b>${esc(S.code)}</b> <span class="ci">⧉ kopieren</span>`}</span>
    ${S.round?`<span class="chip">Runde ${S.round}</span>`:""}
    <span class="chip btn only-mobile" id="plbtn">Spieler (${S.players.length})</span>
    <span class="chip btn" id="sndbtn" title="Ton an- oder ausschalten">${soundOn?"🔊 Ton an":"🔇 Ton aus"}</span>
    ${S.deadline?`<span class="chip clock"><span class="clockv">${fmtTime(timeLeft()||0)}</span></span>`:""}
    <span class="chip btn only-mobile ${unread?"act":""}" id="chattop">Chat${unread?` <span class="bdg">${unread}</span>`:""}</span>
    <span class="chip btn danger" id="${isHost?"closeroom":"leave"}">${isHost?"Raum schließen":"Raum verlassen"}</span>
  </div>`+(idx>=0?`<div class="steps">${steps.map((x,i)=>`<div class="step ${i<=idx?"on":""}"></div>`).join("")}</div>`:"");
}
function frame(main,players,chat){
  return topbar()+`<div class="wrap">
    <div class="main">${main}</div>
    <aside class="colA">${players?`<button class="closex" id="pclose">Schließen</button>${players}`:""}</aside>
    <aside class="colB">${chat||""}</aside>
  </div><div class="scrim" id="scrim"></div>`;
}
function wire(){
  const cc=el("codechip");
  if(cc) cc.onclick=async()=>{
    const link=location.origin+location.pathname+"?r="+S.code;
    if(await inZwischenablage(link)){
      copiedUntil=Date.now()+2000; beep("soft"); render();
      setTimeout(render,2100);
    }else{
      prompt("Link zum Teilen:",link);          // letzter Ausweg: von Hand kopieren
    }
  };
  const shut=()=>document.body.classList.remove("pl-open");
  const pb=el("plbtn"); if(pb) pb.onclick=()=>document.body.classList.toggle("pl-open");
  const sb=el("sndbtn"); if(sb) sb.onclick=()=>{ soundOn=!soundOn; LS.set("fi_sound",soundOn); if(soundOn) beep("soft"); render(); };
  const sc=el("scrim"); if(sc) sc.onclick=shut;
  const pc=el("pclose"); if(pc) pc.onclick=shut;
  const ct=el("chattop");
  if(ct) ct.onclick=()=>{ chatOpen=true; LS.set("fi_chatopen",true); render();
    setTimeout(()=>{ const c=el("chatcard"); if(c) c.scrollIntoView({behavior:"smooth",block:"end"}); },60); };
  const th=el("chathead");
  if(th) th.onclick=()=>{ chatOpen=!chatOpen; LS.set("fi_chatopen",chatOpen); render(); };
  wireExit();
  const cs=el("csend"), ci=el("ci");
  if(cs&&ci){
    const send=()=>{ const v=ci.value.trim(); if(!v) return; draftChat=""; ci.value=""; act({t:"chat",text:v}); ci.focus(); };
    cs.onclick=send; ci.onkeydown=e=>{ if(e.key==="Enter") send(); };
  }
  const f=el("force"); if(f) f.onclick=()=>act({t:"force"});
}
function chatCard(){
  const msgs=S.chat||[], unread=Math.max(0,msgs.length-chatSeen);
  if(!chatOpen) return `<div class="card tight rise" id="chatcard">
    <div id="chathead" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
      <b style="font-size:15px">Chat</b>
      <span class="pts">${unread?`<span class="bdg" style="background:var(--p);color:#fff;padding:1px 7px;border-radius:99px">${unread} neu</span>`:`${msgs.length} Nachrichten · öffnen`}</span>
    </div></div>`;
  return `<div class="card rise chatfull" id="chatcard">
    <div id="chathead" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b style="font-size:15px">Chat</b><span class="pts">zuklappen</span></div>
    <div class="chat-log" id="clog">${
      msgs.length?msgs.map(m=>`<div class="msg ${m.pid===myPid?"me":""}">
        ${avatar(Object.assign({pid:m.pid,name:m.name},S.players.find(x=>x.pid===m.pid)||{}))}
        <div class="bub"><div class="au">${esc(m.name)}</div><div class="tx">${esc(m.text)}</div></div></div>`).join("")
      :`<div class="chat-empty">Noch nichts geschrieben.</div>`}</div>
    <div class="chat-in" style="flex:none"><input id="ci" maxlength="300" placeholder="Nachricht…" autocomplete="off" enterkeyhint="send">
      <button id="csend">→</button></div></div>`;
}
/* Spielerliste – je nach Phase mit Punkten, Status oder Kick-Knopf. */
function playersCard(mode){
  const list=mode==="lobby"?S.players:S.players.filter(p=>!p.waiting);
  const rows=mode==="score"?[...list].sort((x,y)=>y.score-x.score):list;
  const best=rows.length?Math.max(...rows.map(p=>p.score)):0;
  const status=p=>{
    if(!p.online) return `<span class="pts off">weg</span>`;
    if(mode==="answer") return `<span class="pts ${p.answered?"ok":""}">${p.answered?"fertig":"tippt…"}</span>`;
    if(mode==="vote")   return `<span class="pts ${p.voted?"ok":""}">${p.voted?"gewählt":"überlegt…"}</span>`;
    return `<span class="pts">${p.score} Pkt</span>`;
  };
  return `<div class="card rise">
    <h2>${mode==="score"?"Punkte":"Spieler"} (${rows.length})</h2>
    <ul class="plist">${rows.map(p=>`<li>${avatar(p)}
      <span class="nm">${esc(p.name)}${p.pid===myPid?'<span class="tag you">du</span>':""}${p.pid===S.hostId?'<span class="tag host">Host</span>':""}${mode==="score"&&p.score===best&&best>0?'<span class="tag win">vorn</span>':""}
      ${p.online?"":"<small>nicht verbunden</small>"}</span>
      ${status(p)}
      ${mode==="lobby"&&isHost&&p.pid!==myPid?`<button class="mini" data-kick="${esc(p.pid)}" title="Spieler entfernen">✕</button>`:""}</li>`).join("")}</ul>
    ${mode==="score"?`<div class="note">Erwischt die Mehrheit den Lügner, bekommt das ganze Team +1. Kommt er durch, bekommt er allein +1.</div>`:""}
  </div>`;
}
/* Ausstieg – in jeder Phase sichtbar. Der Host schliesst den Raum, alle anderen gehen. */
/* Der Ausstieg sitzt oben in der Kopfleiste (rot) – unten daher nichts mehr. */
function exitBtn(){ return ""; }
function wireExit(){
  const b=el("leave");
  if(b) b.onclick=()=>{
    if(!confirm("Raum wirklich verlassen? Deine Punkte in diesem Raum sind dann weg.")) return;
    act({t:"leave"}); LS.delMine("fi_room");
    setTimeout(()=>{ teardown(); location.replace(location.pathname); },250);
  };
  const c=el("closeroom");
  if(c) c.onclick=()=>{
    if(!confirm("Raum wirklich schließen? Alle Mitspieler fliegen raus.")) return;
    LS.delMine("fi_host"); teardown(); location.replace(location.pathname);
  };
}
/* Host-Knopf: weiter, ohne auf Abwesende zu warten. */
function forceBtn(kind){
  if(!isHost) return "";
  const inR=S.players.filter(p=>!p.waiting);
  const gone=inR.filter(p=>!p.online);
  if(!gone.length) return "";
  const done=inR.filter(p=>p.online).every(p=>kind==="answer"?p.answered:p.voted);
  if(!done) return "";
  return `<button id="force" class="sec">Ohne ${gone.length===1?esc(gone[0].name):gone.length+" Abwesende"} weitermachen</button>`;
}

/* Ein einheitlicher Klapp-Baustein. Die Kopfzeile zeigt immer eine kurze
   Zusammenfassung, damit man den Stand auch im zugeklappten Zustand sieht. */
function klapp(id,titel,inhalt,kurz,vorne){
  const offen=!!offeneKarten[id];
  return `<div class="card rise">
    <div class="klapp" data-klapp="${id}">
      ${vorne||""}
      <b>${titel}</b>
      <span class="kurz">${kurz||""}</span>
      <span class="pfeil">${offen?"▾":"▸"}</span>
    </div>
    ${offen?`<div class="klappinhalt">${inhalt}</div>`:""}
  </div>`;
}
function zeitKurz(v){ return v?secLabel(v):"ohne"; }

function viewLobby(){
  const on=S.players.filter(p=>p.online).length;
  const alle=S.kat.length===KATEGORIEN.length;
  const keine=S.kat.length===0;
  const aktiv=id=>S.kat.indexOf(id)>=0;

  const katInhalt=`<div class="katgrid">${KATEGORIEN.map(k=>{
      const anzahl=PAIRS.filter(x=>x[2]===k.id).length;
      return `<button class="katbtn ${aktiv(k.id)?"on":""}" data-kat="${k.id}" ${isHost?"":"disabled"}>
        <span class="kate">${k.emoji}</span>
        <span class="katn">${esc(k.name)}<small>${anzahl} Paare</small></span>
        <span class="hak">${aktiv(k.id)?"✓":""}</span></button>`;
    }).join("")}</div>
    ${isHost?`<div class="katact">
       <button id="katalle" class="sec">Alle auswählen</button>
       <button id="katnix" class="sec">Alle abwählen</button>
     </div>`:""}`;

  const zeitInhalt=isHost
    ? ["answer","talk","vote"].map(k=>{
        const titel={answer:"Antwortzeit",talk:"Besprechungszeit",vote:"Zeit zum Abstimmen"}[k];
        const wert={answer:S.tAnswer,talk:S.tTalk,vote:S.tVote}[k];
        return `<label style="margin-top:14px">${titel}</label>
          <div class="seg seg3">${[0,30,60].map(v=>
             `<button data-t="${k}" data-sec="${v}" class="${wert===v?"on":""}">${v?secLabel(v):"ohne"}</button>`).join("")}</div>
          <div class="minrow">
            <input class="mininput" type="number" min="2" max="60" step="1" inputmode="numeric"
                   id="min-${k}" placeholder="Minuten" value="${wert>60?wert/60:""}">
            <button class="minset ${wert>60?"on":""}" data-min="${k}">übernehmen</button>
          </div>`;
      }).join("")
    : [["Antwortzeit",S.tAnswer],["Besprechungszeit",S.tTalk],["Abstimmung",S.tVote]].map(([t,v])=>
        `<div class="zeile"><span class="pts">${t}</span><b>${v?secLabel(v):"ohne Limit"}</b></div>`).join("");

  const ich=S.players.find(x=>x.pid===myPid)||{};
  const skinInhalt=`<div id="prev"></div>
     <label style="margin-top:14px">Emoji</label>
     <div class="emogrid" id="emo">${EMOJIS.map(e=>
        `<button data-e="${e}" class="${myEmoji===e?"on":""}">${e}</button>`).join("")}</div>
     <label style="margin-top:14px">Farbe</label>
     <div class="colgrid" id="col">${FARBEN.map(h=>
        `<button data-c="${h}" class="${myColor===h?"on":""}"
          style="background:linear-gradient(140deg,hsl(${h} 95% 62%),hsl(${(h+40)%360} 95% 46%))"></button>`).join("")}</div>
     <label for="colpick" style="margin-top:14px">Eigene Farbe</label>
     <div class="pickrow">
       <input type="color" id="colpick" value="${hueZuHex(myColor==null?265:myColor)}">
       <span class="note" style="margin:0">Beliebigen Ton wählen – der Avatar übernimmt ihn sofort.</span>
     </div>`;

  const startKnopf=n=>isHost
    ? `<button id="go${n}" ${on<3||!S.vorrat?"disabled":""}>Runde starten</button>`+
      (S.vorrat?"":`<div class="note" style="text-align:center">Wähle mindestens eine Fragen-Kategorie aus.</div>`)
    : `<div class="card tight center note rise" style="margin:0 0 13px">Warte auf den Host…</div>`;

  paint(HEAD+frame(
    klapp("kat","Fragen-Kategorien",katInhalt,
          keine?`keine gewählt`
               :alle?`alle · ${S.vorrat} Paare`
                    :`${S.kat.length} von ${KATEGORIEN.length} · ${S.vorrat} Paare`)+
    klapp("zeit","Zeitlimits",zeitInhalt,
          `${zeitKurz(S.tAnswer)} · ${zeitKurz(S.tTalk)} · ${zeitKurz(S.tVote)}`)+
    klapp("skin","Dein Aussehen",skinInhalt,"",
          avatar({pid:myPid,name:ich.name||myName,emoji:myEmoji,color:myColor}))+
    ((canNotify()&&!notifyOn&&Notification.permission!=="denied")
      ? klapp("notif","Benachrichtigungen",
          `<div class="note" style="margin-top:0">Damit du es mitbekommst, wenn eine neue Runde startet – auch wenn der Tab im Hintergrund liegt.</div>
           <button id="notif" class="sec">Einschalten</button>`,"aus")
      : "")+
    `<div class="onlymob">${startKnopf("2")}</div>`,
    playersCard("lobby")+`<div class="onlydesk">${startKnopf("")}</div>`,
    chatCard()));

  wire();

  app.querySelectorAll("[data-klapp]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.klapp;
    offeneKarten[id]=!offeneKarten[id];
    LS.set("fi_offen",offeneKarten);
    render();
  });

  if(el("notif")) el("notif").onclick=askNotify;

  if(isHost){
    app.querySelectorAll("[data-kat]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.kat;
      const liste=S.kat.slice();
      const i=liste.indexOf(id);
      if(i>=0) liste.splice(i,1); else liste.push(id);  // frei an- und abwaehlbar
      act({t:"kat",ids:liste});
    });
    if(el("katalle")) el("katalle").onclick=()=>act({t:"kat",ids:KATEGORIEN.map(k=>k.id)});
    if(el("katnix"))  el("katnix").onclick=()=>act({t:"kat",ids:[]});
  }

  app.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>act({t:"timer",which:b.dataset.t,sec:+b.dataset.sec}));
  app.querySelectorAll("[data-min]").forEach(b=>{
    const k=b.dataset.min, feld=el("min-"+k);
    const uebernehmen=()=>{
      const m=Math.round(+feld.value);
      if(!(m>=2&&m<=60)){ feld.focus(); return; }
      act({t:"timer",which:k,sec:m*60});
    };
    b.onclick=uebernehmen;
    if(feld) feld.onkeydown=e=>{ if(e.key==="Enter") uebernehmen(); };
  });

  const zeigeVorschau=()=>{
    const v=el("prev"); if(!v) return;
    v.innerHTML=`<div class="prevrow">${avatar({pid:myPid,name:ich.name||myName,emoji:myEmoji,color:myColor})}
      <span class="nm">${esc(ich.name||myName)}<span class="tag you">du</span></span>
      <span class="pts">${ich.score||0} Pkt</span></div>`;
  };
  zeigeVorschau();
  const merkeSkin=()=>{ LS.set("fi_emoji",myEmoji); LS.set("fi_color",myColor);
    zeigeVorschau(); act({t:"skin",emoji:myEmoji,color:myColor}); };
  app.querySelectorAll("#emo [data-e]").forEach(b=>b.onclick=()=>{
    myEmoji=(myEmoji===b.dataset.e)?"":b.dataset.e;
    app.querySelectorAll("#emo [data-e]").forEach(x=>x.classList.toggle("on",x.dataset.e===myEmoji));
    merkeSkin();
  });
  app.querySelectorAll("#col [data-c]").forEach(b=>b.onclick=()=>{
    myColor=+b.dataset.c;
    app.querySelectorAll("#col [data-c]").forEach(x=>x.classList.toggle("on",+x.dataset.c===myColor));
    merkeSkin();
  });
  const pick=el("colpick");
  if(pick) pick.oninput=()=>{
    myColor=hexZuHue(pick.value);
    app.querySelectorAll("#col [data-c]").forEach(x=>x.classList.remove("on"));
    merkeSkin();
  };

  ["go","go2"].forEach(id=>{ if(el(id)) el(id).onclick=()=>act({t:"start"}); });
  app.querySelectorAll("[data-kick]").forEach(b=>b.onclick=()=>{
    if(confirm("Diesen Spieler entfernen?")) act({t:"kick",pid:b.dataset.kick});
  });
}

/* Nachzügler sehen nur einen Wartebildschirm – nichts aus der laufenden Runde. */
function viewWaiting(){
  paint(HEAD+frame(
    `<div class="card glow center rise" style="padding:34px 20px">
       <div class="big"><span class="spin" style="width:19px;height:19px"></span>Gleich geht's los</div>
       <div class="note">Du bist im Raum <b>${esc(S.code)}</b>. Die anderen sind noch mitten in Runde ${S.round} –
         sobald die nächste startet, bist du dabei.</div>
     </div>`+exitBtn(),
    "",chatCard()));
  wire();
}
function viewAnswer(me){
  const done=me&&me.answered;
  paint(HEAD+frame(
    `<div class="card qhero rise"><div class="qlbl">Deine Frage</div><div class="q">${esc(myQuestion)}</div></div>`+
    (S.deadline?`<div class="card center rise" style="padding:20px">
        <div class="qlbl" style="margin-bottom:4px">Noch Zeit</div>
        <div class="bigclock clockv">${fmtTime(timeLeft()||0)}</div></div>`:"")+
    (done?`<div class="card center rise"><span class="spin"></span>Warte auf die anderen…</div>${forceBtn("answer")}`
         :`<div class="card rise"><label for="ai">Deine Antwort – kurz halten</label>
             <input id="ai" maxlength="80" placeholder="Antwort…" autocomplete="off" enterkeyhint="send">
             <button id="sb">Antwort abschicken</button>
             <div class="hint">Zeig dein Handy niemandem – nicht jeder hat dieselbe Frage.</div></div>`)
    +(isHost?`<button id="skip" class="sec">Frage überspringen</button>
        <div class="note" style="margin-top:6px">Zieht sofort eine neue Frage für alle. Bisherige Antworten dieser Runde verfallen.</div>`:"")
    +exitBtn(),
    playersCard("answer"),chatCard()));
  wire();
  if(isHost&&el("skip")) el("skip").onclick=()=>{
    if(confirm("Neue Frage für alle ziehen? Die bisherigen Antworten dieser Runde verfallen.")) act({t:"skip"});
  };
  if(!done){
    const ai=el("ai"); ai.focus();
    const send=()=>{ const v=ai.value.trim(); if(!v) return; draftAnswer=""; act({t:"answer",text:v}); };
    el("sb").onclick=send; ai.onkeydown=e=>{ if(e.key==="Enter") send(); };
  }
}
function viewReveal(){
  const inR=S.players.filter(p=>!p.waiting);
  paint(HEAD+frame(
    (S.deadline?`<div class="card center rise" style="padding:16px"><div class="qlbl" style="margin-bottom:3px">Besprechungszeit</div>
       <div class="bigclock clockv" style="font-size:30px">${fmtTime(timeLeft()||0)}</div></div>`:"")+
    `<div class="card qhero rise"><div class="qlbl">Die Hauptfrage war</div><div class="q">${esc(S.mainQuestion)}</div></div>
     <div class="card rise"><h2>Alle Antworten</h2>
       ${inR.map(p=>`<div class="ans">${avatar(p)}<div><div class="who">${esc(p.name)}${p.pid===myPid?" · du":""}</div>
         <div class="txt">${esc(p.answer||"—")}</div></div></div>`).join("")}
       <div class="hint">Jetzt laut diskutieren: Wessen Antwort passt nicht zur Frage?</div></div>
     ${isHost?`<button id="v">Weiter zur Abstimmung</button>`:`<div class="card center note rise">Der Host startet die Abstimmung.</div>`}
     ${exitBtn()}`,
    playersCard("plain"),chatCard()));
  wire();
  if(isHost) el("v").onclick=()=>act({t:"tovote"});
}
function viewVote(me){
  const voted=me&&me.voted;
  const others=S.players.filter(p=>!p.waiting&&p.pid!==myPid);
  paint(HEAD+frame(
    (S.deadline?`<div class="card center rise" style="padding:16px"><div class="qlbl" style="margin-bottom:3px">Noch Zeit zum Abstimmen</div>
       <div class="bigclock clockv" style="font-size:30px">${fmtTime(timeLeft()||0)}</div></div>`:"")+
    `<div class="card qhero rise"><div class="qlbl">Hauptfrage</div><div class="q">${esc(S.mainQuestion)}</div></div>
     <div class="card rise"><h2>Wer hatte die andere Frage?</h2>
       ${voted?`<div class="center note" style="margin-top:0"><span class="spin"></span>Warte auf die anderen…</div>`
              :others.map(p=>`<button class="pick" data-v="${esc(p.pid)}">${avatar(p)}
                 <span class="nm">${esc(p.name)}<small>${esc(p.answer||"")}</small></span></button>`).join("")}
     </div>${voted?forceBtn("vote"):""}${exitBtn()}`,
    playersCard("vote"),chatCard()));
  wire();
  if(!voted) app.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>act({t:"vote",target:b.dataset.v}));
}
function viewResult(){
  const imp=S.players.find(p=>p.pid===S.impostorId);
  const inR=S.players.filter(p=>!p.waiting);
  const me=S.players.find(p=>p.pid===myPid);
  const votesFor=pid=>inR.filter(p=>p.vote===pid).map(p=>p.name);

  /* Teamwertung: Die Gruppe gewinnt oder verliert gemeinsam.
     Ein einzelner richtiger Tipp zaehlt nicht, wenn die Mehrheit danebenliegt. */
  let verdict="";
  if(me&&!me.waiting){
    const bin=me.pid===S.impostorId;
    const won=bin?!S.caught:S.caught;
    const selbstRichtig=!bin&&me.vote===S.impostorId;
    const why=bin
      ?(won?"Niemand hat dich erwischt. +1 Punkt für dich."
           :"Die Mehrheit hat dich erwischt. Diese Runde geht an die anderen.")
      :(won?"Ihr habt den Lügner gemeinsam erwischt. +1 Punkt für jeden im Team."
           :(selbstRichtig?"Dein Tipp war richtig – aber die Mehrheit lag daneben. Keine Punkte."
                          :"Die Mehrheit lag daneben. Der Punkt geht an den Lügner."));
    verdict=`<div class="card ${won?"win":"lose"} center rise" style="padding:26px 20px">
      <div class="verdict ${won?"g":"r"}">${won?"Gewonnen":"Verloren"}</div>
      <div class="vsub">${bin?"Du warst der Lügner. ":""}${why}</div></div>`;
  }

  paint(HEAD+frame(
    verdict+
    `<div class="card glow rise">
       <div class="qlbl">Der Lügner war</div>
       <div class="big" style="margin:2px 0 14px">${esc(imp?imp.name:"—")}</div>
       <div class="qpair">
         <div class="qbox"><div class="k">Alle anderen bekamen</div><div class="v">${esc(S.mainQuestion)}</div></div>
         <div class="qbox imp"><div class="k">${esc(imp?imp.name:"Der Lügner")} bekam</div>
           <div class="v">${esc(S.impostorQuestion||"—")}</div></div>
       </div></div>
     <div class="card rise"><h2>Die Runde im Überblick</h2>
       ${inR.map(p=>{
         const ziel=p.vote?S.players.find(x=>x.pid===p.vote):null;
         const richtig=ziel&&ziel.pid===S.impostorId;
         const bekommen=votesFor(p.pid).length;
         const luegner=p.pid===S.impostorId;
         return `<div class="rundenzeile">
           <div class="kopf">${avatar(p)}
             <span class="who">${esc(p.name)}${p.pid===myPid?" · du":""}${luegner?'<span class="tag imp">Lügner</span>':""}</span>
             ${bekommen?`<span class="pts">${bekommen} ${bekommen===1?"Stimme":"Stimmen"}</span>`:""}
           </div>
           <div class="unten">
             <span class="azeile">${esc(p.answer||"keine Antwort")}</span>
             <span class="vzeile">${
               ziel?`→ ${esc(ziel.name)}${richtig?' <span style="color:var(--ok)">✓</span>':""}`
                   :"nicht abgestimmt"}</span>
           </div>
         </div>`;
       }).join("")}</div>
     ${isHost?`<button id="nx">Nächste Runde</button><button id="lb" class="sec">Zurück in den Warteraum</button>`
             :`<div class="card center note rise">Der Host startet die nächste Runde.</div>`}
     ${exitBtn()}`,
    playersCard("score"),chatCard()));
  wire();
  if(isHost){ el("nx").onclick=()=>act({t:"next"}); el("lb").onclick=()=>act({t:"lobby"}); }
}

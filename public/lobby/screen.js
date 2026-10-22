"use strict";(()=>{var R=["","\u05D0","\u05D1","\u05D2","\u05D3","\u05D4","\u05D5","\u05D6","\u05D7","\u05D8"],U=["","\u05D9","\u05DB","\u05DC","\u05DE","\u05E0","\u05E1","\u05E2","\u05E4","\u05E6"],I=["","\u05E7","\u05E8","\u05E9","\u05EA","\u05EA\u05E7","\u05EA\u05E8","\u05EA\u05E9","\u05EA\u05EA","\u05EA\u05EA\u05E7"];function O(e){if(!Number.isFinite(e)||e<=0)return"";let s="",i=Math.floor(e);i%=1e3,s+=I[Math.floor(i/100)]??"";let n=i%100;return s+=n===15?"\u05D8\u05D5":n===16?"\u05D8\u05D6":U[Math.floor(n/10)]+R[n%10],s.length===0?"":s.length===1?s+"\u05F3":s.slice(0,-1)+"\u05F4"+s.slice(-1)}function $(e,s={}){try{return new Intl.DateTimeFormat("he-u-ca-hebrew",{...s.timeZone?{timeZone:s.timeZone}:{},day:"numeric",month:"long",...s.year?{year:"numeric"}:{}}).formatToParts(e).map(r=>r.type==="day"||r.type==="year"?O(Number(r.value)):r.value).join("").trim()}catch{return""}}var k="Asia/Jerusalem";function b(e,s=k){let i=new Intl.DateTimeFormat("en-CA",{timeZone:s,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),n=r=>{var d;return((d=i.find(h=>h.type===r))==null?void 0:d.value)??""};return`${n("year")}-${n("month")}-${n("day")}`}var P={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function u(e){return String(e??"").replace(/[&<>"']/g,s=>P[s])}function z(e,s=40){if(e.length===0)return"";let i=n=>`<div class="ss-mq-card"><div class="ss-mq-name">${u(n.name)}</div><div class="ss-mq-h"><div class="ss-mq-n">${n.hours.toLocaleString("en-US")}</div><div class="ss-mq-u">hrs</div></div></div>`;return`<div class="ss-mq-track" style="animation-duration:${s}s">${[...e,...e].map(i).join("")}</div>`}var o=e=>String(e).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]),l=(e,s="")=>`<span class="ss-ms"${s?` style="${s}"`:""}>${o(e)}</span>`,S=/\bfamil(y|ies)\b/i;function _(e){let s=e.trim().replace(S,i=>i[0].toUpperCase()+i.slice(1).toLowerCase());return s.charAt(0).toUpperCase()+s.slice(1)}function T(e){let s=e.venue,i=o(e.allDay?"All day":e.timeRange||e.time);return/^happening now$/i.test(e.label)&&S.test(e.groupLine)?`<div class="slide">
  <div class="slide-label" style="background:#ff8e00"><i></i>Welcome</div>
  <div class="slide-body">
    <div class="slide-hello">Welcome to Just One Chesed!</div>
    <div class="slide-program">${o(_(e.groupLine))}</div>
  </div>
  ${s?`<div class="venue-pill" style="background:${o(s.color)}">${l(s.icon)}${o(s.chip)}</div>`:""}
  <div class="slide-time">${l("schedule")}${i}${e.program?` &middot; ${o(e.program)}`:""}</div>
</div>`:`<div class="slide">
  <div class="slide-label" style="background:${o((s==null?void 0:s.color)||"#214ba5")}"><i></i>${o(e.label||"Today")}</div>
  <div class="slide-body">
    <div class="slide-program">${o(e.program)}</div>
    ${e.groupLine?`<div class="slide-group">${o(e.groupLine)}</div>`:""}
  </div>
  ${s?`<div class="venue-pill" style="background:${o(s.color)}">${l(s.icon)}${o(s.chip)}</div>`:""}
  <div class="slide-time">${l("schedule")}${i}</div>
</div>`}function F(){return`<div class="slide slide-stand">
  <div class="stand-group">
    <div class="slide-program">Did you do your just one chesed today?</div>
    <div class="slide-label" style="background:#ff8e00"><i></i>Just One Chesed</div>
    <div class="slide-standing">${l("volunteer_activism")}</div>
  </div>
</div>`}function D(e){let s=e.map(i=>{let n=i.value.replace(/\D/g,"").length>=5;return`<div class="ss-tile${i.on?" on":""}">
    <div class="ss-tile-h"><div class="ss-tile-l">${o(i.label)}</div>${l(i.icon)}</div>
    <div class="ss-tile-n${n?" ss-long":""}">${o(i.value)}</div>
    <div class="ss-tile-s">${o(i.unit)}</div>
  </div>`}).join("");return`<div class="ss-gr-head">
  <div class="ss-gr-k">${l("volunteer_activism")}Our impact</div>
</div>
<div class="ss-gr-tiles ss-three">${s}</div>`}function E(e,s){let i=s.en?`<div class="ss-so-topic">${l("menu_book")}${o(s.en)}${s.he?`<span class="so-topic-he" dir="rtl">${o(s.he)}</span>`:""}</div>`:"",n=`<div class="ss-so-head">
  <div class="ss-so-k">${l("campaign")}Chesed shout-out</div>
  ${i}
</div>`;if(e){let r=e.text.length>95?34:40;return`${n}
${s.question?`<div class="ss-so-q">${o(s.question)}</div>`:""}
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${r}px">\u201C${o(e.text)}\u201D</div>
  ${e.from?`<div class="ss-so-from">${o(e.from)}</div>`:""}
</div>`}return`${n}
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">${o(s.question)}</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`}var M=new URLSearchParams(location.search),w=M.has("demo"),N=M.has("debug"),B=5*6e4,J=8e3,A="joc-lobby-screen",G=Date.now(),t={data:null,etag:"",fetchedAt:null,offline:!1,error:"",slide:0,shout:0,countFrom:0},a=e=>document.querySelector(e);document.getElementById("app").innerHTML=`
<div class="ss-stage">
  <div class="ss-canvas" id="canvas">
    <div class="ss-hdr">
      <div class="ss-logo" id="logo"></div>
      <div class="ss-name"><div class="ss-name-t" id="name"></div><div class="ss-name-s" id="stats"></div></div>
      <div class="ss-ded" id="ded"></div>
      <div class="ss-clock-box"><div class="ss-clock" id="clock"></div><div class="ss-date" id="date"></div><div class="ss-hdate" id="hdate"></div></div>
    </div>
    <div class="ss-mid" id="mid">
      <div class="ss-slides" id="slides"><div id="track"></div></div>
      <div class="ss-right">
        <div class="ss-so" id="so">
          <div class="ss-so-content" id="soContent"></div>
          <div class="ss-so-qr" id="soQr"><div class="ss-so-qr-l">Scan to share yours</div><div class="ss-so-qr-box" id="soQrBox"></div></div>
        </div>
        <div class="ss-gr" id="grades"></div>
      </div>
    </div>
    <div class="ss-band">
      <div class="ss-band-logo"><img src="/brand/joc-wordmark.png" alt="Just One Chesed" /></div>
      <div class="ss-around" id="around"><div class="ss-k" id="aroundK"></div><div class="ss-mq" id="mq"></div></div>
    </div>
  </div>
</div>
<div class="ss-offline ss-hide" id="offline"></div>
${N?'<div class="ss-debug" id="debug"></div>':""}`;var v=0;function m(){let e=document.documentElement,s=e.clientWidth||window.innerWidth,i=e.clientHeight||window.innerHeight;if(!s||!i)return;let n=Math.min(s/1920,i/1080);n>0&&n!==v&&(v=n,a("#canvas").style.transform=`scale(${n})`)}window.addEventListener("resize",m);window.addEventListener("load",m);m();var Z=window.setInterval(m,1e3);window.setTimeout(()=>window.clearInterval(Z),12e3);var g={};function c(e,s){g[e]!==s&&(g[e]=s,a(`#${e}`).innerHTML=s)}function p(e,s){a(`#${e}`).classList.toggle("ss-hide",!s)}function f(e){let s=t.countFrom?Math.min(1,(Date.now()-t.countFrom)/2e3):1;return Math.round(e*(1-Math.pow(1-s,3))).toLocaleString("en-US")}function W(e){let s=e.lobby.today.length?e.lobby.today:e.lobby.ahead;return s.length===0?[{html:F()}]:s.map(i=>({html:T(i)}))}function C(){let e=new Date;a("#clock").textContent=e.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),a("#date").textContent=e.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),a("#hdate").textContent=$(e,{year:!0})}function j(e){let s=[];e.stats.acts!=null&&s.push(`${f(e.stats.acts)} acts of chesed`),e.worldHours!=null&&s.push(`${f(e.worldHours)} total hours`),a("#stats").textContent=s.join(" \xB7 ")}function x(){let e=t.data;if(C(),!e)return;c("logo",""),c("name",'<img src="/brand/joc-wordmark-white.png" alt="Just One Chesed" />'),j(e),p("ded",!!e.dedication),e.dedication&&c("ded",`<div class="ss-ded-t">Today\u2019s chesed is dedicated to a refuah shleima for <span class="ss-ded-he" dir="rtl">${u(e.dedication.hebrewName)}</span></div>
<div class="ss-ded-s">${u(e.dedication.text||"Sponsor a day \xB7 dedications@justonechesed.org")}</div>`);let s=W(e),i=s.map(d=>d.html).join("");g.track!==i&&(g.track=i,a("#track").innerHTML=s.map((d,h)=>`<div class="ss-slide" data-i="${h}">${d.html}</div>`).join("")),p("slides",s.length>0),a("#mid").classList.toggle("ss-solo",s.length===0);let n=s.length?t.slide%s.length:0;document.querySelectorAll("#track .ss-slide").forEach((d,h)=>d.classList.toggle("on",h===n));let r=e.shoutOuts.length?e.shoutOuts[t.shout%e.shoutOuts.length]:null;c("soContent",E(r,e.lobby.theme)),p("soQr",!!e.shoutOutQrSvg),c("soQrBox",e.shoutOutQrSvg??""),p("grades",!0),c("grades",D([{label:"Hours",value:e.lobby.hours!=null?f(e.lobby.hours):"\u2014",unit:"of chesed",icon:"schedule",on:!0},{label:"Beds",value:f(e.lobby.counters.beds)+"+",unit:"given out",icon:"bed"},{label:"Pizzas",value:f(e.lobby.counters.pizzas),unit:"made",icon:"local_pizza"}])),p("around",e.network.length>0),e.network.length&&(a("#aroundK").textContent="Around JOC schools \xB7 all time",c("mq",z(e.network,Math.max(30,e.network.length*7)))),Q()}function Q(){var s;if(!N)return;let e=t.fetchedAt?Math.round((Date.now()-t.fetchedAt.getTime())/1e3):null;a("#debug").textContent=[`lobby${w?" (demo)":""}`,`data: ${e===null?"none yet":`${e}s old`} \xB7 version ${((s=t.data)==null?void 0:s.version)??"-"}`,`scale: ${v.toFixed(3)} \xB7 slide ${t.slide}`,t.error?`last error: ${t.error}`:""].filter(Boolean).join(`
`)}function V(){try{let e=localStorage.getItem(A);return e?JSON.parse(e):null}catch{return null}}function K(){try{localStorage.setItem(A,JSON.stringify({data:t.data,etag:t.etag}))}catch{}}async function y(){try{let s=await fetch("/api/lobby/screen",{cache:"no-store",headers:t.etag&&t.data?{"if-none-match":t.etag}:{}});if(s.status===304)t.fetchedAt=new Date;else if(s.ok){let i=!t.data;t.data=await s.json(),t.etag=s.headers.get("etag")??"",t.fetchedAt=new Date,i&&(t.countFrom=Date.now(),requestAnimationFrame(H)),w||K()}else throw new Error(`HTTP ${s.status}`);t.offline=!1,t.error=""}catch(e){t.offline=!0,t.error=e instanceof Error?e.message:String(e)}p("offline",t.offline),x()}var q=b(new Date);function Y(){Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",hour:"numeric",hourCycle:"h23"}).format(new Date))===3&&Date.now()-G>60*6e4&&location.reload();let s=b(new Date);s!==q&&(q=s,y())}if(!w){let e=V();e!=null&&e.data&&(t.data=e.data,t.etag=e.etag)}x();y();window.setInterval(y,B);window.setInterval(()=>{t.slide+=1,t.slide%2===0&&(t.shout+=1),x()},J);window.setInterval(C,15e3);window.setInterval(Y,6e4);function H(){t.data&&(j(t.data),Date.now()-t.countFrom<2100&&requestAnimationFrame(H))}var L;(L=document.fonts)==null||L.ready.then(()=>{for(let e of Object.keys(g))delete g[e];x()});})();

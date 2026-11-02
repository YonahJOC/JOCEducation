"use strict";(()=>{var R=["","\u05D0","\u05D1","\u05D2","\u05D3","\u05D4","\u05D5","\u05D6","\u05D7","\u05D8"],I=["","\u05D9","\u05DB","\u05DC","\u05DE","\u05E0","\u05E1","\u05E2","\u05E4","\u05E6"],O=["","\u05E7","\u05E8","\u05E9","\u05EA","\u05EA\u05E7","\u05EA\u05E8","\u05EA\u05E9","\u05EA\u05EA","\u05EA\u05EA\u05E7"];function _(e){if(!Number.isFinite(e)||e<=0)return"";let s="",t=Math.floor(e);t%=1e3,s+=O[Math.floor(t/100)]??"";let n=t%100;return s+=n===15?"\u05D8\u05D5":n===16?"\u05D8\u05D6":I[Math.floor(n/10)]+R[n%10],s.length===0?"":s.length===1?s+"\u05F3":s.slice(0,-1)+"\u05F4"+s.slice(-1)}function $(e,s={}){try{return new Intl.DateTimeFormat("he-u-ca-hebrew",{...s.timeZone?{timeZone:s.timeZone}:{},day:"numeric",month:"long",...s.year?{year:"numeric"}:{}}).formatToParts(e).map(r=>r.type==="day"||r.type==="year"?_(Number(r.value)):r.value).join("").trim()}catch{return""}}var k="Asia/Jerusalem";function b(e,s=k){let t=new Intl.DateTimeFormat("en-CA",{timeZone:s,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),n=r=>{var a;return((a=t.find(h=>h.type===r))==null?void 0:a.value)??""};return`${n("year")}-${n("month")}-${n("day")}`}var P={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function u(e){return String(e??"").replace(/[&<>"']/g,s=>P[s])}function z(e,s=40){if(e.length===0)return"";let t=n=>`<div class="ss-mq-card"><div class="ss-mq-name">${u(n.name)}</div><div class="ss-mq-h"><div class="ss-mq-n">${n.hours.toLocaleString("en-US")}</div><div class="ss-mq-u">hrs</div></div></div>`;return`<div class="ss-mq-track" style="animation-duration:${s}s">${[...e,...e].map(t).join("")}</div>`}var o=e=>String(e).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]),d=(e,s="")=>`<span class="ss-ms"${s?` style="${s}"`:""}>${o(e)}</span>`,S=/\bfamil(y|ies)\b/i;function B(e){let s=e.trim().replace(S,t=>t[0].toUpperCase()+t.slice(1).toLowerCase());return s.charAt(0).toUpperCase()+s.slice(1)}function T(e){let s=e.venue,t=o(e.allDay?"All day":e.timeRange||e.time);return/^happening now$/i.test(e.label)&&S.test(e.groupLine)?`<div class="slide">
  <div class="slide-label" style="background:#ff8e00"><i></i>Welcome</div>
  <div class="slide-body">
    <div class="slide-hello">Welcome to Just One Chesed!</div>
    <div class="slide-program">${o(B(e.groupLine))}</div>
  </div>
  ${s?`<div class="venue-pill" style="background:${o(s.color)}">${d(s.icon)}${o(s.chip)}</div>`:""}
  <div class="slide-time">${d("schedule")}${t}${e.program?` &middot; ${o(e.program)}`:""}</div>
</div>`:`<div class="slide">
  <div class="slide-label" style="background:${o((s==null?void 0:s.color)||"#214ba5")}"><i></i>${o(e.label||"Today")}</div>
  <div class="slide-body">
    <div class="slide-program">${o(e.program)}</div>
    ${e.groupLine?`<div class="slide-group">${o(e.groupLine)}</div>`:""}
  </div>
  ${s?`<div class="venue-pill" style="background:${o(s.color)}">${d(s.icon)}${o(s.chip)}</div>`:""}
  <div class="slide-time">${d("schedule")}${t}</div>
</div>`}function F(e){let s=(e.caption??"").trim();return`<div class="slide slide-photo">
  <img class="slide-photo-img" src="${o(e.imageUrl)}" alt="" />
  <div class="slide-photo-tag">${d("photo_camera")}Chesed in action</div>
  ${s?`<div class="slide-photo-cap">${o(s)}</div>`:""}
</div>`}function D(){return`<div class="slide slide-stand">
  <div class="stand-group">
    <div class="slide-program">Did you do your just one chesed today?</div>
    <div class="slide-label" style="background:#ff8e00"><i></i>Just One Chesed</div>
    <div class="slide-standing">${d("volunteer_activism")}</div>
  </div>
</div>`}function E(e){let s=e.map(t=>{let n=t.value.replace(/\D/g,"").length>=5;return`<div class="ss-tile${t.on?" on":""}">
    <div class="ss-tile-h"><div class="ss-tile-l">${o(t.label)}</div>${d(t.icon)}</div>
    <div class="ss-tile-n${n?" ss-long":""}">${o(t.value)}</div>
    <div class="ss-tile-s">${o(t.unit)}</div>
  </div>`}).join("");return`<div class="ss-gr-head">
  <div class="ss-gr-k">${d("volunteer_activism")}Our impact</div>
</div>
<div class="ss-gr-tiles ss-three">${s}</div>`}function q(e,s){let t=s.en?`<div class="ss-so-topic">${d("menu_book")}${o(s.en)}${s.he?`<span class="so-topic-he" dir="rtl">${o(s.he)}</span>`:""}</div>`:"",n=`<div class="ss-so-head">
  <div class="ss-so-k">${d("campaign")}Chesed shout-out</div>
  ${t}
</div>`;if(e){let r=e.text.length>95?34:40;return`${n}
${s.question?`<div class="ss-so-q">${o(s.question)}</div>`:""}
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${r}px">\u201C${o(e.text)}\u201D</div>
  ${e.from?`<div class="ss-so-from">${o(e.from)}</div>`:""}
</div>`}return`${n}
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">${o(s.question)}</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`}var N=new URLSearchParams(location.search),w=N.has("demo"),A=N.has("debug"),J=5*6e4,G=8e3,C="joc-lobby-screen",Z=Date.now(),i={data:null,etag:"",fetchedAt:null,offline:!1,error:"",slide:0,shout:0,countFrom:0},l=e=>document.querySelector(e);document.getElementById("app").innerHTML=`
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
${A?'<div class="ss-debug" id="debug"></div>':""}`;var v=0;function m(){let e=document.documentElement,s=e.clientWidth||window.innerWidth,t=e.clientHeight||window.innerHeight;if(!s||!t)return;let n=Math.min(s/1920,t/1080);n>0&&n!==v&&(v=n,l("#canvas").style.transform=`scale(${n})`)}window.addEventListener("resize",m);window.addEventListener("load",m);m();var W=window.setInterval(m,1e3);window.setTimeout(()=>window.clearInterval(W),12e3);var g={};function c(e,s){g[e]!==s&&(g[e]=s,l(`#${e}`).innerHTML=s)}function p(e,s){l(`#${e}`).classList.toggle("ss-hide",!s)}function f(e){let s=i.countFrom?Math.min(1,(Date.now()-i.countFrom)/2e3):1;return Math.round(e*(1-Math.pow(1-s,3))).toLocaleString("en-US")}function Q(e){let s=e.lobby.today.length?e.lobby.today:e.lobby.ahead,t=s.length===0?[{html:D()}]:s.map(a=>({html:T(a)})),n=e.photos.map(a=>({html:F(a)}));if(n.length===0)return t;let r=[];for(let a=0;a<Math.max(n.length,t.length);a++)a<n.length&&r.push(n[a]),a<t.length&&r.push(t[a]);return r}function H(){let e=new Date;l("#clock").textContent=e.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),l("#date").textContent=e.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),l("#hdate").textContent=$(e,{year:!0})}function j(e){let s=[];e.stats.acts!=null&&s.push(`${f(e.stats.acts)} acts of chesed`),e.worldHours!=null&&s.push(`${f(e.worldHours)} total hours`),l("#stats").textContent=s.join(" \xB7 ")}function x(){let e=i.data;if(H(),!e)return;c("logo",""),c("name",'<img src="/brand/joc-wordmark-white.png" alt="Just One Chesed" />'),j(e),p("ded",!!e.dedication),e.dedication&&c("ded",`<div class="ss-ded-t">Today\u2019s chesed is dedicated to a refuah shleima for <span class="ss-ded-he" dir="rtl">${u(e.dedication.hebrewName)}</span></div>
<div class="ss-ded-s">${u(e.dedication.text||"Sponsor a day \xB7 dedications@justonechesed.org")}</div>`);let s=Q(e),t=s.map(a=>a.html).join("");g.track!==t&&(g.track=t,l("#track").innerHTML=s.map((a,h)=>`<div class="ss-slide" data-i="${h}">${a.html}</div>`).join("")),p("slides",s.length>0),l("#mid").classList.toggle("ss-solo",s.length===0);let n=s.length?i.slide%s.length:0;document.querySelectorAll("#track .ss-slide").forEach((a,h)=>a.classList.toggle("on",h===n));let r=e.shoutOuts.length?e.shoutOuts[i.shout%e.shoutOuts.length]:null;c("soContent",q(r,e.lobby.theme)),p("soQr",!!e.shoutOutQrSvg),c("soQrBox",e.shoutOutQrSvg??""),p("grades",!0),c("grades",E([{label:"Hours",value:e.lobby.hours!=null?f(e.lobby.hours):"\u2014",unit:"of chesed",icon:"schedule",on:!0},{label:"Beds",value:f(e.lobby.counters.beds)+"+",unit:"given out",icon:"bed"},{label:"Pizzas",value:f(e.lobby.counters.pizzas),unit:"made",icon:"local_pizza"}])),p("around",e.network.length>0),e.network.length&&(l("#aroundK").textContent="Around JOC schools \xB7 all time",c("mq",z(e.network,Math.max(30,e.network.length*7)))),V()}function V(){var s;if(!A)return;let e=i.fetchedAt?Math.round((Date.now()-i.fetchedAt.getTime())/1e3):null;l("#debug").textContent=[`lobby${w?" (demo)":""}`,`data: ${e===null?"none yet":`${e}s old`} \xB7 version ${((s=i.data)==null?void 0:s.version)??"-"}`,`scale: ${v.toFixed(3)} \xB7 slide ${i.slide}`,i.error?`last error: ${i.error}`:""].filter(Boolean).join(`
`)}function K(){try{let e=localStorage.getItem(C);return e?JSON.parse(e):null}catch{return null}}function Y(){try{localStorage.setItem(C,JSON.stringify({data:i.data,etag:i.etag}))}catch{}}async function y(){try{let s=await fetch("/api/lobby/screen",{cache:"no-store",headers:i.etag&&i.data?{"if-none-match":i.etag}:{}});if(s.status===304)i.fetchedAt=new Date;else if(s.ok){let t=!i.data;i.data=await s.json(),i.etag=s.headers.get("etag")??"",i.fetchedAt=new Date,t&&(i.countFrom=Date.now(),requestAnimationFrame(U)),w||Y()}else throw new Error(`HTTP ${s.status}`);i.offline=!1,i.error=""}catch(e){i.offline=!0,i.error=e instanceof Error?e.message:String(e)}p("offline",i.offline),x()}var L=b(new Date);function X(){Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",hour:"numeric",hourCycle:"h23"}).format(new Date))===3&&Date.now()-Z>60*6e4&&location.reload();let s=b(new Date);s!==L&&(L=s,y())}if(!w){let e=K();e!=null&&e.data&&(i.data=e.data,i.etag=e.etag)}x();y();window.setInterval(y,J);window.setInterval(()=>{i.slide+=1,i.slide%2===0&&(i.shout+=1),x()},G);window.setInterval(H,15e3);window.setInterval(X,6e4);function U(){i.data&&(j(i.data),Date.now()-i.countFrom<2100&&requestAnimationFrame(U))}var M;(M=document.fonts)==null||M.ready.then(()=>{for(let e of Object.keys(g))delete g[e];x()});})();

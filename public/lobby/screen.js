"use strict";(()=>{var U=["","\u05D0","\u05D1","\u05D2","\u05D3","\u05D4","\u05D5","\u05D6","\u05D7","\u05D8"],_=["","\u05D9","\u05DB","\u05DC","\u05DE","\u05E0","\u05E1","\u05E2","\u05E4","\u05E6"],P=["","\u05E7","\u05E8","\u05E9","\u05EA","\u05EA\u05E7","\u05EA\u05E8","\u05EA\u05E9","\u05EA\u05EA","\u05EA\u05EA\u05E7"];function B(s){if(!Number.isFinite(s)||s<=0)return"";let e="",i=Math.floor(s);i%=1e3,e+=P[Math.floor(i/100)]??"";let n=i%100;return e+=n===15?"\u05D8\u05D5":n===16?"\u05D8\u05D6":_[Math.floor(n/10)]+U[n%10],e.length===0?"":e.length===1?e+"\u05F3":e.slice(0,-1)+"\u05F4"+e.slice(-1)}function S(s,e={}){try{return new Intl.DateTimeFormat("he-u-ca-hebrew",{...e.timeZone?{timeZone:e.timeZone}:{},day:"numeric",month:"long",...e.year?{year:"numeric"}:{}}).formatToParts(s).map(r=>r.type==="day"||r.type==="year"?B(Number(r.value)):r.value).join("").trim()}catch{return""}}var E="Asia/Jerusalem";function y(s,e=E){let i=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(s),n=r=>{var g;return((g=i.find(a=>a.type===r))==null?void 0:g.value)??""};return`${n("year")}-${n("month")}-${n("day")}`}var J={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function l(s){return String(s??"").replace(/[&<>"']/g,e=>J[e])}var m=(s,e="")=>`<span class="ss-ms ${e}">${l(s)}</span>`;function D(s,e){let i=s.text.length>95?34:40;return`<div class="ss-so-head">
  <div class="ss-so-k">${m("campaign")}Chesed shout-out</div>
  ${e?`<div class="ss-so-topic">${m("today")}${l(e)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${i}px">\u201C${l(s.text)}\u201D</div>
  ${s.from?`<div class="ss-so-from">${l(s.from)}</div>`:""}
</div>`}function T(s){return`<div class="ss-so-head">
  <div class="ss-so-k">${m("campaign")}Chesed shout-out</div>
  ${s?`<div class="ss-so-topic">${m("today")}${l(s)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">Who made a difference to you this week?</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`}function F(s,e=40){if(s.length===0)return"";let i=n=>`<div class="ss-mq-card"><div class="ss-mq-name">${l(n.name)}</div><div class="ss-mq-h"><div class="ss-mq-n">${n.hours.toLocaleString("en-US")}</div><div class="ss-mq-u">hrs</div></div></div>`;return`<div class="ss-mq-track" style="animation-duration:${e}s">${[...s,...s].map(i).join("")}</div>`}var d=s=>String(s).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),x=(s,e="")=>`<span class="ss-ms"${e?` style="${e}"`:""}>${d(s)}</span>`;function q(s){var a,h;let e=s.program.trim().split(/\s+/),i=e.length>1?e[e.length-1]:s.program,n=e.length>1?e.slice(0,-1).join(" "):"",r=(f,O)=>Math.max(26,Math.min(O,Math.round(657/Math.max(1,f.length*.62)))),g=[s.allDay?"All day":s.timeRange||s.time,s.groupLine,(a=s.venue)==null?void 0:a.chip].filter(f=>!!(f&&f.trim())).map(f=>`<div class="ss-pill">${x("check")}${d(f)}</div>`).join("");return`<div class="ss-fl ss-fl-program ss-blue">
  <div class="ss-bubble"></div><div class="ss-bubble-2"></div>
  <div class="ss-sticker ss-sticker-sm">
    <div class="ss-st-k">${d(s.label||"Today")}</div>
    <div class="ss-st-big">${d(s.allDay?"All day":s.time)}</div>
  </div>
  <div class="ss-pg-icon">${x(((h=s.venue)==null?void 0:h.icon)||"volunteer_activism")}</div>
  <div class="ss-pg-title">${n?`<div class="ss-pg-small" style="font-size:${r(n,56)}px">${d(n)}</div>`:""}<div class="ss-pg-big" style="font-size:${r(i,124)}px">${d(i)}</div></div>
  <div class="ss-pg-meta">${g}</div>
</div>`}function L(s){let e=s.map(i=>{let n=i.value.replace(/\D/g,"").length>=5;return`<div class="ss-tile${i.on?" on":""}">
    <div class="ss-tile-h"><div class="ss-tile-l">${d(i.label)}</div>${x(i.icon)}</div>
    <div class="ss-tile-n${n?" ss-long":""}">${d(i.value)}</div>
    <div class="ss-tile-s">${d(i.unit)}</div>
  </div>`}).join("");return`<div class="ss-gr-head">
  <div class="ss-gr-k">${x("volunteer_activism")}Our impact</div>
</div>
<div class="ss-gr-tiles ss-three">${e}</div>`}var A=new URLSearchParams(location.search),k=A.has("demo"),C=A.has("debug"),G=5*6e4,Z=8e3,j="joc-lobby-screen",W=Date.now(),t={data:null,etag:"",fetchedAt:null,offline:!1,error:"",slide:0,shout:0,countFrom:0},o=s=>document.querySelector(s);document.getElementById("app").innerHTML=`
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
      <div class="ss-sect" id="themeSect">
        <div class="ss-sect-ic"><span class="ss-ms">menu_book</span></div>
        <div class="ss-sect-txt"><div class="ss-k" id="schoolsLearning"></div><div class="ss-theme" id="theme"></div><div class="ss-theme-he" dir="rtl" id="themeHe"></div></div>
      </div>
      <div class="ss-around" id="around"><div class="ss-k" id="aroundK"></div><div class="ss-mq" id="mq"></div></div>
      <div class="ss-world" id="world"><span class="ss-ms">public</span><div><div class="ss-world-n" id="worldN"></div><div class="ss-world-l">hours of chesed worldwide</div></div></div>
    </div>
  </div>
</div>
<div class="ss-offline ss-hide" id="offline"></div>
${C?'<div class="ss-debug" id="debug"></div>':""}`;var $=0;function v(){let s=document.documentElement,e=s.clientWidth||window.innerWidth,i=s.clientHeight||window.innerHeight;if(!e||!i)return;let n=Math.min(e/1920,i/1080);n>0&&n!==$&&($=n,o("#canvas").style.transform=`scale(${n})`)}window.addEventListener("resize",v);window.addEventListener("load",v);v();var Q=window.setInterval(v,1e3);window.setTimeout(()=>window.clearInterval(Q),12e3);var u={};function c(s,e){u[s]!==e&&(u[s]=e,o(`#${s}`).innerHTML=e)}function p(s,e){o(`#${s}`).classList.toggle("ss-hide",!e)}function b(s){let e=t.countFrom?Math.min(1,(Date.now()-t.countFrom)/2e3):1;return Math.round(s*(1-Math.pow(1-e,3))).toLocaleString("en-US")}function V(s){return(s.lobby.today.length?s.lobby.today:s.lobby.ahead).map(i=>({html:q(i)}))}function H(){let s=new Date;o("#clock").textContent=s.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),o("#date").textContent=s.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),o("#hdate").textContent=S(s,{year:!0})}function R(s){o("#stats").textContent="",p("world",s.worldHours!=null),s.worldHours!=null&&(o("#worldN").textContent=b(s.worldHours))}function w(){var g;let s=t.data;if(H(),!s)return;c("logo",`<img src="${l(s.school.logoUrl||"/brand/joc-icon.png")}" alt="Just One Chesed" />`),c("name","Just One <span>Chesed</span>"),R(s),p("ded",!!s.dedication),s.dedication&&c("ded",`<div class="ss-ded-t">Today\u2019s chesed is dedicated to a refuah shleima for <span class="ss-ded-he" dir="rtl">${l(s.dedication.hebrewName)}</span></div>
<div class="ss-ded-s">${l(s.dedication.text||"Sponsor a day \xB7 dedications@justonechesed.org")}</div>`);let e=V(s),i=e.map(a=>a.html).join("");u.track!==i&&(u.track=i,o("#track").innerHTML=e.map((a,h)=>`<div class="ss-slide" data-i="${h}">${a.html}</div>`).join("")),p("slides",e.length>0),o("#mid").classList.toggle("ss-solo",e.length===0);let n=e.length?t.slide%e.length:0;document.querySelectorAll("#track .ss-slide").forEach((a,h)=>a.classList.toggle("on",h===n));let r=((g=s.theme)==null?void 0:g.topic)??null;s.shoutOuts.length?c("soContent",D(s.shoutOuts[t.shout%s.shoutOuts.length],r)):c("soContent",T(r)),p("soQr",!!s.shoutOutQrSvg),c("soQrBox",s.shoutOutQrSvg??""),p("grades",!0),c("grades",L([{label:"Hours",value:s.lobby.hours!=null?b(s.lobby.hours):"\u2014",unit:"of chesed",icon:"schedule",on:!0},{label:"Beds",value:b(s.lobby.counters.beds)+"+",unit:"given out",icon:"bed"},{label:"Pizzas",value:b(s.lobby.counters.pizzas)+"+",unit:"made",icon:"local_pizza"}])),p("themeSect",!!s.theme),s.theme&&(o("#schoolsLearning").textContent="This cycle",o("#theme").textContent=s.theme.en,o("#themeHe").textContent=s.theme.he??""),p("around",s.network.length>0),s.network.length&&(o("#aroundK").textContent="Around JOC schools \xB7 all time",c("mq",F(s.network,Math.max(30,s.network.length*7)))),K()}function K(){var e;if(!C)return;let s=t.fetchedAt?Math.round((Date.now()-t.fetchedAt.getTime())/1e3):null;o("#debug").textContent=[`lobby${k?" (demo)":""}`,`data: ${s===null?"none yet":`${s}s old`} \xB7 version ${((e=t.data)==null?void 0:e.version)??"-"}`,`scale: ${$.toFixed(3)} \xB7 slide ${t.slide}`,t.error?`last error: ${t.error}`:""].filter(Boolean).join(`
`)}function X(){try{let s=localStorage.getItem(j);return s?JSON.parse(s):null}catch{return null}}function Y(){try{localStorage.setItem(j,JSON.stringify({data:t.data,etag:t.etag}))}catch{}}async function z(){try{let e=await fetch("/api/lobby/screen",{cache:"no-store",headers:t.etag&&t.data?{"if-none-match":t.etag}:{}});if(e.status===304)t.fetchedAt=new Date;else if(e.ok){let i=!t.data;t.data=await e.json(),t.etag=e.headers.get("etag")??"",t.fetchedAt=new Date,i&&(t.countFrom=Date.now(),requestAnimationFrame(I)),k||Y()}else throw new Error(`HTTP ${e.status}`);t.offline=!1,t.error=""}catch(s){t.offline=!0,t.error=s instanceof Error?s.message:String(s)}p("offline",t.offline),w()}var M=y(new Date);function ss(){Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",hour:"numeric",hourCycle:"h23"}).format(new Date))===3&&Date.now()-W>60*6e4&&location.reload();let e=y(new Date);e!==M&&(M=e,z())}if(!k){let s=X();s!=null&&s.data&&(t.data=s.data,t.etag=s.etag)}w();z();window.setInterval(z,G);window.setInterval(()=>{t.slide+=1,t.slide%2===0&&(t.shout+=1),w()},Z);window.setInterval(H,15e3);window.setInterval(ss,6e4);function I(){t.data&&(R(t.data),Date.now()-t.countFrom<2100&&requestAnimationFrame(I))}var N;(N=document.fonts)==null||N.ready.then(()=>{for(let s of Object.keys(u))delete u[s];w()});})();

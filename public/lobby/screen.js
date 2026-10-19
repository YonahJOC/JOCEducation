"use strict";(()=>{var _=["","\u05D0","\u05D1","\u05D2","\u05D3","\u05D4","\u05D5","\u05D6","\u05D7","\u05D8"],P=["","\u05D9","\u05DB","\u05DC","\u05DE","\u05E0","\u05E1","\u05E2","\u05E4","\u05E6"],B=["","\u05E7","\u05E8","\u05E9","\u05EA","\u05EA\u05E7","\u05EA\u05E8","\u05EA\u05E9","\u05EA\u05EA","\u05EA\u05EA\u05E7"];function J(s){if(!Number.isFinite(s)||s<=0)return"";let e="",n=Math.floor(s);n%=1e3,e+=B[Math.floor(n/100)]??"";let t=n%100;return e+=t===15?"\u05D8\u05D5":t===16?"\u05D8\u05D6":P[Math.floor(t/10)]+_[t%10],e.length===0?"":e.length===1?e+"\u05F3":e.slice(0,-1)+"\u05F4"+e.slice(-1)}function S(s,e={}){try{return new Intl.DateTimeFormat("he-u-ca-hebrew",{...e.timeZone?{timeZone:e.timeZone}:{},day:"numeric",month:"long",...e.year?{year:"numeric"}:{}}).formatToParts(s).map(o=>o.type==="day"||o.type==="year"?J(Number(o.value)):o.value).join("").trim()}catch{return""}}var T="Asia/Jerusalem";function y(s,e=T){let n=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(s),t=o=>{var g;return((g=n.find(c=>c.type===o))==null?void 0:g.value)??""};return`${t("year")}-${t("month")}-${t("day")}`}var G={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function d(s){return String(s??"").replace(/[&<>"']/g,e=>G[e])}var x=(s,e="")=>`<span class="ss-ms ${e}">${d(s)}</span>`;function E(s,e){let n=s.text.length>95?34:40;return`<div class="ss-so-head">
  <div class="ss-so-k">${x("campaign")}Chesed shout-out</div>
  ${e?`<div class="ss-so-topic">${x("today")}${d(e)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${n}px">\u201C${d(s.text)}\u201D</div>
  ${s.from?`<div class="ss-so-from">${d(s.from)}</div>`:""}
</div>`}function D(s){return`<div class="ss-so-head">
  <div class="ss-so-k">${x("campaign")}Chesed shout-out</div>
  ${s?`<div class="ss-so-topic">${x("today")}${d(s)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">Who made a difference to you this week?</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`}function F(s,e=40){if(s.length===0)return"";let n=t=>`<div class="ss-mq-card"><div class="ss-mq-name">${d(t.name)}</div><div class="ss-mq-h"><div class="ss-mq-n">${t.hours.toLocaleString("en-US")}</div><div class="ss-mq-u">hrs</div></div></div>`;return`<div class="ss-mq-track" style="animation-duration:${e}s">${[...s,...s].map(n).join("")}</div>`}var r=s=>String(s).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),m=(s,e="")=>`<span class="ss-ms"${e?` style="${e}"`:""}>${r(s)}</span>`;function L(s){var c,h;let e=s.program.trim().split(/\s+/),n=e.length>1?e[e.length-1]:s.program,t=e.length>1?e.slice(0,-1).join(" "):"",o=(l,U)=>Math.max(26,Math.min(U,Math.round(657/Math.max(1,l.length*.62)))),g=[s.allDay?"All day":s.timeRange||s.time,s.groupLine,(c=s.venue)==null?void 0:c.chip].filter(l=>!!(l&&l.trim())).map(l=>`<div class="ss-pill">${m("check")}${r(l)}</div>`).join("");return`<div class="ss-fl ss-fl-program ss-blue">
  <div class="ss-bubble"></div><div class="ss-bubble-2"></div>
  <div class="ss-sticker ss-sticker-sm">
    <div class="ss-st-k">${r(s.label||"Today")}</div>
    <div class="ss-st-big">${r(s.allDay?"All day":s.time)}</div>
  </div>
  <div class="ss-pg-icon">${m(((h=s.venue)==null?void 0:h.icon)||"volunteer_activism")}</div>
  <div class="ss-pg-title">${t?`<div class="ss-pg-small" style="font-size:${o(t,56)}px">${r(t)}</div>`:""}<div class="ss-pg-big" style="font-size:${o(n,124)}px">${r(n)}</div></div>
  <div class="ss-pg-meta">${g}</div>
</div>`}function q(s,e,n,t){let o=t>1?`<div class="ss-cdots">${Array.from({length:t},(g,c)=>`<div class="ss-cdot${c===n?" on":""}"></div>`).join("")}</div>`:"";return`<div class="ss-cap-head">
  <div class="ss-cap-k">${m("today")}${r(s)}</div>
  ${o}
</div>
<div class="ss-cap-t">${r(e)}</div>`}function M(s){let e=s.map(n=>{let t=n.value.replace(/\D/g,"").length>=5;return`<div class="ss-tile${n.on?" on":""}">
    <div class="ss-tile-h"><div class="ss-tile-l">${r(n.label)}</div>${m(n.icon)}</div>
    <div class="ss-tile-n${t?" ss-long":""}">${r(n.value)}</div>
    <div class="ss-tile-s">${r(n.unit)}</div>
  </div>`}).join("");return`<div class="ss-gr-head">
  <div class="ss-gr-k">${m("volunteer_activism")}Our impact</div>
</div>
<div class="ss-gr-tiles ss-three">${e}</div>`}var C=new URLSearchParams(location.search),k=C.has("demo"),j=C.has("debug"),Z=5*6e4,W=8e3,H="joc-lobby-screen",Q=Date.now(),i={data:null,etag:"",fetchedAt:null,offline:!1,error:"",slide:0,shout:0,countFrom:0},a=s=>document.querySelector(s);document.getElementById("app").innerHTML=`
<div class="ss-stage">
  <div class="ss-canvas" id="canvas">
    <div class="ss-hdr">
      <div class="ss-logo" id="logo"></div>
      <div class="ss-name"><div class="ss-name-t" id="name"></div><div class="ss-name-s" id="stats"></div></div>
      <div class="ss-ded" id="ded"></div>
      <div class="ss-clock-box"><div class="ss-clock" id="clock"></div><div class="ss-date" id="date"></div><div class="ss-hdate" id="hdate"></div></div>
    </div>
    <div class="ss-mid" id="mid">
      <div class="ss-slides" id="slides"><div id="track"></div><div class="ss-cap" id="cap"></div></div>
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
${j?'<div class="ss-debug" id="debug"></div>':""}`;var $=0;function v(){let s=document.documentElement,e=s.clientWidth||window.innerWidth,n=s.clientHeight||window.innerHeight;if(!e||!n)return;let t=Math.min(e/1920,n/1080);t>0&&t!==$&&($=t,a("#canvas").style.transform=`scale(${t})`)}window.addEventListener("resize",v);window.addEventListener("load",v);v();var V=window.setInterval(v,1e3);window.setTimeout(()=>window.clearInterval(V),12e3);var u={};function p(s,e){u[s]!==e&&(u[s]=e,a(`#${s}`).innerHTML=e)}function f(s,e){a(`#${s}`).classList.toggle("ss-hide",!e)}function b(s){let e=i.countFrom?Math.min(1,(Date.now()-i.countFrom)/2e3):1;return Math.round(s*(1-Math.pow(1-e,3))).toLocaleString("en-US")}function K(s){return(s.lobby.today.length===0?s.lobby.ahead:s.lobby.today).map(t=>{var o;return{html:L(t),line:[t.groupLine,(o=t.venue)==null?void 0:o.chip].filter(Boolean).join("  \xB7  ")||t.program}})}function R(){let s=new Date;a("#clock").textContent=s.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),a("#date").textContent=s.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),a("#hdate").textContent=S(s,{year:!0})}function I(s){a("#stats").textContent="",f("world",s.worldHours!=null),s.worldHours!=null&&(a("#worldN").textContent=b(s.worldHours))}function w(){var c;let s=i.data;if(R(),!s)return;p("logo",`<img src="${d(s.school.logoUrl||"/brand/joc-icon.png")}" alt="Just One Chesed" />`),p("name","Just One <span>Chesed</span>"),I(s),f("ded",!!s.dedication),s.dedication&&p("ded",`<div class="ss-ded-t">Today\u2019s chesed is dedicated to a refuah shleima for <span class="ss-ded-he" dir="rtl">${d(s.dedication.hebrewName)}</span></div>
<div class="ss-ded-s">${d(s.dedication.text||"Sponsor a day \xB7 dedications@justonechesed.org")}</div>`);let e=K(s),n=e.map(h=>h.html).join("");u.track!==n&&(u.track=n,a("#track").innerHTML=e.map((h,l)=>`<div class="ss-slide" data-i="${l}">${h.html}</div>`).join("")),f("slides",e.length>0),a("#mid").classList.toggle("ss-solo",e.length===0);let t=e.length?i.slide%e.length:0;document.querySelectorAll("#track .ss-slide").forEach((h,l)=>h.classList.toggle("on",l===t));let o=s.lobby.today.length===0;a("#cap").classList.toggle("on",e.length>0),e.length&&p("cap",q(o?"Coming up this week at JOC":"Today at JOC",e[t].line,t,e.length));let g=((c=s.theme)==null?void 0:c.topic)??null;s.shoutOuts.length?p("soContent",E(s.shoutOuts[i.shout%s.shoutOuts.length],g)):p("soContent",D(g)),f("soQr",!!s.shoutOutQrSvg),p("soQrBox",s.shoutOutQrSvg??""),f("grades",!0),p("grades",M([{label:"Hours",value:s.lobby.hours!=null?b(s.lobby.hours):"\u2014",unit:"of chesed",icon:"schedule",on:!0},{label:"Beds",value:b(s.lobby.counters.beds)+"+",unit:"given out",icon:"bed"},{label:"Pizzas",value:b(s.lobby.counters.pizzas)+"+",unit:"made",icon:"local_pizza"}])),f("themeSect",!!s.theme),s.theme&&(a("#schoolsLearning").textContent="This cycle",a("#theme").textContent=s.theme.en,a("#themeHe").textContent=s.theme.he??""),f("around",s.network.length>0),s.network.length&&(a("#aroundK").textContent="Around JOC schools \xB7 all time",p("mq",F(s.network,Math.max(30,s.network.length*7)))),X()}function X(){var e;if(!j)return;let s=i.fetchedAt?Math.round((Date.now()-i.fetchedAt.getTime())/1e3):null;a("#debug").textContent=[`lobby${k?" (demo)":""}`,`data: ${s===null?"none yet":`${s}s old`} \xB7 version ${((e=i.data)==null?void 0:e.version)??"-"}`,`scale: ${$.toFixed(3)} \xB7 slide ${i.slide}`,i.error?`last error: ${i.error}`:""].filter(Boolean).join(`
`)}function Y(){try{let s=localStorage.getItem(H);return s?JSON.parse(s):null}catch{return null}}function ss(){try{localStorage.setItem(H,JSON.stringify({data:i.data,etag:i.etag}))}catch{}}async function z(){try{let e=await fetch("/api/lobby/screen",{cache:"no-store",headers:i.etag&&i.data?{"if-none-match":i.etag}:{}});if(e.status===304)i.fetchedAt=new Date;else if(e.ok){let n=!i.data;i.data=await e.json(),i.etag=e.headers.get("etag")??"",i.fetchedAt=new Date,n&&(i.countFrom=Date.now(),requestAnimationFrame(O)),k||ss()}else throw new Error(`HTTP ${e.status}`);i.offline=!1,i.error=""}catch(s){i.offline=!0,i.error=s instanceof Error?s.message:String(s)}f("offline",i.offline),w()}var N=y(new Date);function es(){Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",hour:"numeric",hourCycle:"h23"}).format(new Date))===3&&Date.now()-Q>60*6e4&&location.reload();let e=y(new Date);e!==N&&(N=e,z())}if(!k){let s=Y();s!=null&&s.data&&(i.data=s.data,i.etag=s.etag)}w();z();window.setInterval(z,Z);window.setInterval(()=>{i.slide+=1,i.slide%2===0&&(i.shout+=1),w()},W);window.setInterval(R,15e3);window.setInterval(es,6e4);function O(){i.data&&(I(i.data),Date.now()-i.countFrom<2100&&requestAnimationFrame(O))}var A;(A=document.fonts)==null||A.ready.then(()=>{for(let s of Object.keys(u))delete u[s];w()});})();

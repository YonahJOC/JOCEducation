"use strict";(()=>{var I=["","\u05D0","\u05D1","\u05D2","\u05D3","\u05D4","\u05D5","\u05D6","\u05D7","\u05D8"],O=["","\u05D9","\u05DB","\u05DC","\u05DE","\u05E0","\u05E1","\u05E2","\u05E4","\u05E6"],U=["","\u05E7","\u05E8","\u05E9","\u05EA","\u05EA\u05E7","\u05EA\u05E8","\u05EA\u05E9","\u05EA\u05EA","\u05EA\u05EA\u05E7"];function _(e){if(!Number.isFinite(e)||e<=0)return"";let s="",i=Math.floor(e);i%=1e3,s+=U[Math.floor(i/100)]??"";let n=i%100;return s+=n===15?"\u05D8\u05D5":n===16?"\u05D8\u05D6":O[Math.floor(n/10)]+I[n%10],s.length===0?"":s.length===1?s+"\u05F3":s.slice(0,-1)+"\u05F4"+s.slice(-1)}function z(e,s={}){try{return new Intl.DateTimeFormat("he-u-ca-hebrew",{...s.timeZone?{timeZone:s.timeZone}:{},day:"numeric",month:"long",...s.year?{year:"numeric"}:{}}).formatToParts(e).map(l=>l.type==="day"||l.type==="year"?_(Number(l.value)):l.value).join("").trim()}catch{return""}}var S="Asia/Jerusalem";function w(e,s=S){let i=new Intl.DateTimeFormat("en-CA",{timeZone:s,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),n=l=>{var h;return((h=i.find(p=>p.type===l))==null?void 0:h.value)??""};return`${n("year")}-${n("month")}-${n("day")}`}var P={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function a(e){return String(e??"").replace(/[&<>"']/g,s=>P[s])}var f=(e,s="")=>`<span class="ss-ms ${s}">${a(e)}</span>`;function T(e,s){let i=e.text.length>95?34:40;return`<div class="ss-so-head">
  <div class="ss-so-k">${f("campaign")}Chesed shout-out</div>
  ${s?`<div class="ss-so-topic">${f("today")}${a(s)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${i}px">\u201C${a(e.text)}\u201D</div>
  ${e.from?`<div class="ss-so-from">${a(e.from)}</div>`:""}
</div>`}function E(e){return`<div class="ss-so-head">
  <div class="ss-so-k">${f("campaign")}Chesed shout-out</div>
  ${e?`<div class="ss-so-topic">${f("today")}${a(e)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">Who made a difference to you this week?</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`}function D(e,s=40){if(e.length===0)return"";let i=n=>`<div class="ss-mq-card"><div class="ss-mq-name">${a(n.name)}</div><div class="ss-mq-h"><div class="ss-mq-n">${n.hours.toLocaleString("en-US")}</div><div class="ss-mq-u">hrs</div></div></div>`;return`<div class="ss-mq-track" style="animation-duration:${s}s">${[...e,...e].map(i).join("")}</div>`}var r=e=>String(e).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]),u=(e,s="")=>`<span class="ss-ms"${s?` style="${s}"`:""}>${r(e)}</span>`;function F(e){let s=e.venue;return`<div class="slide">
  <div class="slide-body">
    <div class="slide-label" style="background:${r((s==null?void 0:s.color)||"#214ba5")}"><i></i>${r(e.label||"Today")}</div>
    <div class="slide-program">${r(e.program)}</div>
    <div class="slide-group">${r(e.groupLine)}</div>
    <div class="slide-time">${u("schedule")}${r(e.allDay?"All day":e.timeRange||e.time)}</div>
  </div>
  ${s?`<div class="venue-block" style="background:${r(s.color)}">
    ${u(s.icon)}
    <div class="venue-short">${r(s.chip)}</div>
  </div>`:""}
</div>`}function q(e){let s=e.map(i=>{let n=i.value.replace(/\D/g,"").length>=5;return`<div class="ss-tile${i.on?" on":""}">
    <div class="ss-tile-h"><div class="ss-tile-l">${r(i.label)}</div>${u(i.icon)}</div>
    <div class="ss-tile-n${n?" ss-long":""}">${r(i.value)}</div>
    <div class="ss-tile-s">${r(i.unit)}</div>
  </div>`}).join("");return`<div class="ss-gr-head">
  <div class="ss-gr-k">${u("volunteer_activism")}Our impact</div>
</div>
<div class="ss-gr-tiles ss-three">${s}</div>`}var N=new URLSearchParams(location.search),$=N.has("demo"),A=N.has("debug"),B=5*6e4,J=8e3,C="joc-lobby-screen",G=Date.now(),t={data:null,etag:"",fetchedAt:null,offline:!1,error:"",slide:0,shout:0,countFrom:0},o=e=>document.querySelector(e);document.getElementById("app").innerHTML=`
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
${A?'<div class="ss-debug" id="debug"></div>':""}`;var y=0;function x(){let e=document.documentElement,s=e.clientWidth||window.innerWidth,i=e.clientHeight||window.innerHeight;if(!s||!i)return;let n=Math.min(s/1920,i/1080);n>0&&n!==y&&(y=n,o("#canvas").style.transform=`scale(${n})`)}window.addEventListener("resize",x);window.addEventListener("load",x);x();var Z=window.setInterval(x,1e3);window.setTimeout(()=>window.clearInterval(Z),12e3);var g={};function d(e,s){g[e]!==s&&(g[e]=s,o(`#${e}`).innerHTML=s)}function c(e,s){o(`#${e}`).classList.toggle("ss-hide",!s)}function m(e){let s=t.countFrom?Math.min(1,(Date.now()-t.countFrom)/2e3):1;return Math.round(e*(1-Math.pow(1-s,3))).toLocaleString("en-US")}function W(e){return(e.lobby.today.length?e.lobby.today:e.lobby.ahead).map(i=>({html:F(i)}))}function j(){let e=new Date;o("#clock").textContent=e.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),o("#date").textContent=e.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}),o("#hdate").textContent=z(e,{year:!0})}function H(e){o("#stats").textContent="",c("world",e.worldHours!=null),e.worldHours!=null&&(o("#worldN").textContent=m(e.worldHours))}function b(){var h;let e=t.data;if(j(),!e)return;d("logo",`<img src="${a(e.school.logoUrl||"/brand/joc-icon.png")}" alt="Just One Chesed" />`),d("name","Just One <span>Chesed</span>"),H(e),c("ded",!!e.dedication),e.dedication&&d("ded",`<div class="ss-ded-t">Today\u2019s chesed is dedicated to a refuah shleima for <span class="ss-ded-he" dir="rtl">${a(e.dedication.hebrewName)}</span></div>
<div class="ss-ded-s">${a(e.dedication.text||"Sponsor a day \xB7 dedications@justonechesed.org")}</div>`);let s=W(e),i=s.map(p=>p.html).join("");g.track!==i&&(g.track=i,o("#track").innerHTML=s.map((p,v)=>`<div class="ss-slide" data-i="${v}">${p.html}</div>`).join("")),c("slides",s.length>0),o("#mid").classList.toggle("ss-solo",s.length===0);let n=s.length?t.slide%s.length:0;document.querySelectorAll("#track .ss-slide").forEach((p,v)=>p.classList.toggle("on",v===n));let l=((h=e.theme)==null?void 0:h.topic)??null;e.shoutOuts.length?d("soContent",T(e.shoutOuts[t.shout%e.shoutOuts.length],l)):d("soContent",E(l)),c("soQr",!!e.shoutOutQrSvg),d("soQrBox",e.shoutOutQrSvg??""),c("grades",!0),d("grades",q([{label:"Hours",value:e.lobby.hours!=null?m(e.lobby.hours):"\u2014",unit:"of chesed",icon:"schedule",on:!0},{label:"Beds",value:m(e.lobby.counters.beds)+"+",unit:"given out",icon:"bed"},{label:"Pizzas",value:m(e.lobby.counters.pizzas)+"+",unit:"made",icon:"local_pizza"}])),c("themeSect",!!e.theme),e.theme&&(o("#schoolsLearning").textContent="This cycle",o("#theme").textContent=e.theme.en,o("#themeHe").textContent=e.theme.he??""),c("around",e.network.length>0),e.network.length&&(o("#aroundK").textContent="Around JOC schools \xB7 all time",d("mq",D(e.network,Math.max(30,e.network.length*7)))),Q()}function Q(){var s;if(!A)return;let e=t.fetchedAt?Math.round((Date.now()-t.fetchedAt.getTime())/1e3):null;o("#debug").textContent=[`lobby${$?" (demo)":""}`,`data: ${e===null?"none yet":`${e}s old`} \xB7 version ${((s=t.data)==null?void 0:s.version)??"-"}`,`scale: ${y.toFixed(3)} \xB7 slide ${t.slide}`,t.error?`last error: ${t.error}`:""].filter(Boolean).join(`
`)}function V(){try{let e=localStorage.getItem(C);return e?JSON.parse(e):null}catch{return null}}function K(){try{localStorage.setItem(C,JSON.stringify({data:t.data,etag:t.etag}))}catch{}}async function k(){try{let s=await fetch("/api/lobby/screen",{cache:"no-store",headers:t.etag&&t.data?{"if-none-match":t.etag}:{}});if(s.status===304)t.fetchedAt=new Date;else if(s.ok){let i=!t.data;t.data=await s.json(),t.etag=s.headers.get("etag")??"",t.fetchedAt=new Date,i&&(t.countFrom=Date.now(),requestAnimationFrame(R)),$||K()}else throw new Error(`HTTP ${s.status}`);t.offline=!1,t.error=""}catch(e){t.offline=!0,t.error=e instanceof Error?e.message:String(e)}c("offline",t.offline),b()}var L=w(new Date);function X(){Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",hour:"numeric",hourCycle:"h23"}).format(new Date))===3&&Date.now()-G>60*6e4&&location.reload();let s=w(new Date);s!==L&&(L=s,k())}if(!$){let e=V();e!=null&&e.data&&(t.data=e.data,t.etag=e.etag)}b();k();window.setInterval(k,B);window.setInterval(()=>{t.slide+=1,t.slide%2===0&&(t.shout+=1),b()},J);window.setInterval(j,15e3);window.setInterval(X,6e4);function R(){t.data&&(H(t.data),Date.now()-t.countFrom<2100&&requestAnimationFrame(R))}var M;(M=document.fonts)==null||M.ready.then(()=>{for(let e of Object.keys(g))delete g[e];b()});})();

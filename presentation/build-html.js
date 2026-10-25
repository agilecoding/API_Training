// Generates the HTML deck from the same slide definitions as the PPTX (build.js).
// It swaps pptxgenjs for a small shim that records every slide and renders it as
// absolutely positioned HTML (1 inch = 100 px), then adds animation and navigation.
//
//   node build-html.js [artifact-fragment-output-path]
//
// Outputs: html-deck/public/index.html (standalone, self-contained)
//          optional fragment (no <html>/<head>) for pasting into hosted page frames.
const Module = require("module");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "html-deck", "public");
const FRAGMENT_OUT = process.argv[2];
const PX = 100;
const px = v => +(v * PX).toFixed(1);
const pt = v => +(v * PX / 72).toFixed(2);
const col = c => (c ? (String(c).startsWith("#") ? c : "#" + c) : "transparent");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fillOf = f => (f && typeof f === "object" ? f.color : f);
const ad = a => (a === false ? "" : " a");
const av = a => (a === false ? "" : "--d:" + a + "ms;");
const FONT = f => (f === "Consolas" ? "var(--mono)" : "var(--sans)");

class Slide {
  constructor() { this.els = []; this.notes = ""; this.bg = "F7F9FC"; }
  set background(v) { this.bg = v.color; }
  addNotes(t) { this.notes = t; }
  addText(t, o = {}) { this.els.push({ k: "text", t, o }); return this; }
  addShape(type, o = {}) { this.els.push({ k: "shape", type, o }); return this; }
  addImage(o) { this.els.push({ k: "img", o }); return this; }
  addTable(rows, o) { this.els.push({ k: "table", rows, o }); return this; }
}
class Pres {
  constructor() { this.slides = []; }
  addSlide() { const s = new Slide(); this.slides.push(s); return s; }
  writeFile() { build(this); return Promise.resolve("html"); }
}

// ---------- text ----------
function runsToHtml(t, base) {
  const runs = typeof t === "string" ? [{ text: t, options: {} }] : t;
  const paras = [];
  let cur = { spans: [], bullet: null, after: 0 };
  const push = () => { paras.push(cur); cur = { spans: [], bullet: null, after: 0 }; };
  runs.forEach(r => {
    const o = Object.assign({}, base, r.options || {});
    const style = [];
    if (o.color) style.push("color:" + col(o.color));
    if (o.bold) style.push("font-weight:700");
    if (o.italic) style.push("font-style:italic");
    if (o.fontSize) style.push("font-size:" + pt(o.fontSize) + "px");
    if (o.fontFace) style.push("font-family:" + FONT(o.fontFace));
    if (o.charSpacing) style.push("letter-spacing:" + pt(o.charSpacing) + "px");
    const html = esc(r.text).replace(/\n/g, "<br>");
    cur.spans.push('<span style="' + style.join(";") + '">' + html + "</span>");
    if (r.options && r.options.bullet) cur.bullet = r.options.bullet;
    if (r.options && r.options.paraSpaceAfter) cur.after = r.options.paraSpaceAfter;
    if (r.options && r.options.breakLine) push();
  });
  if (cur.spans.length) push();
  return paras.map(p => p.bullet
    ? '<div class="p b" style="--ind:' + pt((p.bullet.indent || 18) + 2) + "px;margin-bottom:" + pt(p.after) + 'px"><span class="bt">&bull;</span><span class="bx">' + p.spans.join("") + "</span></div>"
    : '<div class="p">' + p.spans.join("") + "</div>").join("");
}

const VAL = { top: "flex-start", middle: "center", bottom: "flex-end" };
function textEl(e, anim) {
  const o = e.o;
  const s = ["left:" + px(o.x) + "px", "top:" + px(o.y) + "px", "width:" + px(o.w) + "px", "height:" + px(o.h) + "px"];
  s.push("justify-content:" + (VAL[o.valign] || "flex-start"));
  s.push("text-align:" + (o.align || "left"));
  s.push("font-size:" + pt(o.fontSize || 18) + "px");
  s.push("font-family:" + FONT(o.fontFace));
  s.push("color:" + col(o.color || "000000"));
  if (o.bold) s.push("font-weight:700");
  if (o.italic) s.push("font-style:italic");
  if (o.charSpacing) s.push("letter-spacing:" + pt(o.charSpacing) + "px");
  let pad = pt(o.margin || 0);
  if (o.fill || o.line) pad = Math.max(pad, 6);
  s.push("padding:" + pad + "px");
  if (o.fill) s.push("background:" + col(fillOf(o.fill)));
  if (o.line) s.push("border:" + Math.max(1, pt(o.line.width || 1)) + "px solid " + col(o.line.color));
  if (o.shape === "roundRect") s.push("border-radius:" + px(o.rectRadius || 0.08) + "px");
  return '<div class="el t' + ad(anim) + '" style="' + av(anim) + s.join(";") + '">' + runsToHtml(e.t, {}) + "</div>";
}

// ---------- shapes ----------
const markers = new Set();
function lineEl(e, anim) {
  const o = e.o, l = o.line || {};
  const w = px(o.w), h = px(o.h), pad = 14;
  const x1 = (o.flipH ? w : 0) + pad, y1 = (o.flipV ? h : 0) + pad;
  const x2 = (o.flipH ? 0 : w) + pad, y2 = (o.flipV ? 0 : h) + pad;
  const sw = Math.max(1, pt(l.width || 1)), c = col(l.color);
  const id = c.replace("#", "m");
  let mk = "";
  if (l.endArrowType) { markers.add(c); mk += ' marker-end="url(#' + id + ')"'; }
  if (l.beginArrowType) { markers.add(c); mk += ' marker-start="url(#' + id + 's)"'; }
  const dash = l.dashType ? ' stroke-dasharray="' + sw * 3 + " " + sw * 2 + '"' : "";
  const flow = l.endArrowType ? '<line class="flow" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#fff" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="2 22"/>' : "";
  return '<svg class="el ln' + ad(anim) + '" style="' + av(anim) + 'left:' + (px(o.x) - pad) + "px;top:" + (px(o.y) - pad) + "px;width:" + (w + pad * 2) + "px;height:" + (h + pad * 2) + 'px" viewBox="0 0 ' + (w + pad * 2) + " " + (h + pad * 2) + '" aria-hidden="true">' +
    '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="' + sw + '"' + dash + mk + "/>" + flow + "</svg>";
}
function shapeEl(e, anim) {
  const o = e.o;
  if (e.type === "line") return lineEl(e, anim);
  const s = ["left:" + px(o.x) + "px", "top:" + px(o.y) + "px", "width:" + px(o.w) + "px", "height:" + px(o.h) + "px"];
  if (o.fill) s.push("background:" + col(fillOf(o.fill)));
  if (o.line) s.push("border:" + Math.max(1, pt(o.line.width || 1)) + "px solid " + col(o.line.color));
  if (e.type === "ellipse") s.push("border-radius:50%");
  return '<div class="el' + ad(anim) + '" style="' + av(anim) + s.join(";") + '"></div>';
}

// ---------- image / table ----------
function imgEl(e, anim) {
  const o = e.o, file = path.resolve(__dirname, o.path);
  const data = "data:image/png;base64," + fs.readFileSync(file).toString("base64");
  return '<img class="el' + ad(anim) + '" alt="Illustration: HTTP/1.1, HTTP/2 and HTTP/3 streams flowing to the globe" style="' + av(anim) + 'left:' + px(o.x) + "px;top:" + px(o.y) + "px;width:" + px(o.w) + "px;height:" + px(o.h) + 'px" src="' + data + '">';
}
function tableEl(e, anim) {
  const o = e.o, b = o.border || {};
  const bd = Math.max(1, pt(b.pt || 0.75)) + "px solid " + col(b.color || "CBD5E1");
  const rh = i => px(Array.isArray(o.rowH) ? o.rowH[i] : o.rowH || 0.4);
  const padCss = o.margin != null ? pt(o.margin) + "px" : "5px 10px";
  const cg = o.colW.map(w => '<col style="width:' + px(w) + 'px">').join("");
  const rows = e.rows.map((r, i) => '<tr style="height:' + rh(i) + 'px">' + r.map(c => {
    const co = c.options || {};
    const st = ["border:" + bd, "padding:" + padCss, "vertical-align:" + (co.valign === "top" ? "top" : co.valign === "bottom" ? "bottom" : "middle"),
      "text-align:" + (co.align || "left"), "background:" + col(fillOf(co.fill)), "color:" + col(co.color || "1F2937"),
      "font-size:" + pt(co.fontSize || 14) + "px", "font-family:" + FONT(co.fontFace)];
    if (co.bold) st.push("font-weight:700");
    if (co.italic) st.push("font-style:italic");
    return '<td style="' + st.join(";") + '"><div class="tc">' + runsToHtml(c.text, {}) + "</div></td>";
  }).join("") + "</tr>").join("");
  return '<div class="el tb' + ad(anim) + '" style="' + av(anim) + 'left:' + px(o.x) + "px;top:" + px(o.y) + "px;width:" + px(o.w) + 'px"><table><colgroup>' + cg + "</colgroup>" + rows + "</table></div>";
}

// ---------- slide / deck ----------
function titleOf(s, dark) {
  const t = s.els.find(e => e.k === "text" && typeof e.t === "string" && e.t && (dark ? (e.o.fontSize >= 40) : (e.o.fontSize === 28 && e.o.y < 1)));
  return t ? t.t.replace(/\s+/g, " ") : "";
}
function slideHtml(s, i) {
  const dark = s.bg.toUpperCase() === "0B1F3A";
  let k = 0;
  const body = s.els.map(e => {
    const y = e.o.y;
    const stat = !dark && (y < 1.1 || y > 6.95);
    let anim = false;
    if (!stat) { anim = 120 + Math.min(k * 30, 1300) + (e.k === "shape" && e.type === "line" ? 120 : 0); k++; }
    if (e.k === "text") return textEl(e, anim);
    if (e.k === "shape") return shapeEl(e, anim);
    if (e.k === "img") return imgEl(e, anim);
    return tableEl(e, anim);
  }).join("");
  const title = titleOf(s, dark) || "Slide " + (i + 1);
  const part = dark && s.els.some(e => e.k === "text" && e.o.fontSize === 44) ? ' data-part="1"' : "";
  return '<section class="slide' + (dark ? " dk" : "") + '" id="s' + (i + 1) + '" data-title="' + esc(title) + '"' + part + ' data-notes="' + esc(s.notes) + '" style="background:' + col(s.bg) + '">' + body + "</section>";
}

const CSS = String.raw`
:root{--ink:#07121f;--bar:#0b1f3a;--bar-line:#1d3557;--text:#e6eef7;--muted:#9fb3c8;--accent:#0f9d8f;--accent-2:#f59e0b;--sans:"Carlito",Calibri,"Segoe UI",system-ui,sans-serif;--mono:"Inconsolata",Consolas,"Cascadia Mono",ui-monospace,monospace;color-scheme:dark}
html,body{height:100%;margin:0}
body{background:var(--ink);color:var(--text);font-family:var(--sans);overflow:hidden}
.app{height:100%;display:flex;flex-direction:column}
.stagewrap{position:relative;flex:1;min-height:0;overflow:hidden;touch-action:pan-y}
.stage{position:absolute;left:50%;top:50%;width:1333px;height:750px;transform-origin:center center;transform:translate(-50%,-50%);box-shadow:0 10px 40px rgba(0,0,0,.5);border-radius:4px;overflow:hidden;background:#0b1f3a}
.slide{position:absolute;inset:0;display:none;overflow:hidden}
.slide.active{display:block;animation:sIn .35s ease-out both}
@keyframes sIn{from{opacity:0}to{opacity:1}}
.el{position:absolute;box-sizing:border-box}
.t{display:flex;flex-direction:column;white-space:pre-wrap;overflow-wrap:break-word;line-height:1.2;margin:0}
.t .p{min-height:0}
.p.b{display:flex}.p.b .bt{flex:0 0 var(--ind)}.p.b .bx{flex:1;min-width:0}
.ln{overflow:visible;pointer-events:none}
.tb table{width:100%;table-layout:fixed;border-collapse:collapse}
.tb td{box-sizing:border-box;overflow-wrap:break-word;line-height:1.2;white-space:pre-wrap}
.slide.active .a{animation:pop .55s cubic-bezier(.2,.8,.2,1) var(--d,0ms) both}
@keyframes pop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
.slide.active .ln.a{animation:fade .5s ease-out var(--d,0ms) both}
@keyframes fade{from{opacity:0}to{opacity:1}}
.slide.active .flow{animation:flow 1.6s linear 1s infinite;opacity:.8}
@keyframes flow{to{stroke-dashoffset:-48}}
.slide:not(.active) .flow{animation:none}
.hit{position:absolute;top:0;bottom:0;width:9%;border:0;background:transparent;cursor:pointer;z-index:5;opacity:0;transition:opacity .2s;color:#fff;font-size:34px}
.hit:hover,.hit:focus-visible{opacity:1;background:linear-gradient(90deg,rgba(7,18,31,.35),transparent)}
.hit.r{right:0}.hit.l{left:0}.hit.r:hover,.hit.r:focus-visible{background:linear-gradient(270deg,rgba(7,18,31,.35),transparent)}
.bar{flex:none;display:flex;align-items:center;gap:6px;background:var(--bar);border-top:1px solid var(--bar-line);padding:6px max(10px,env(safe-area-inset-right,0px)) 6px max(10px,env(safe-area-inset-left,0px));position:relative}
.prog{position:absolute;left:0;top:-1px;height:3px;background:var(--accent);width:0;transition:width .3s}
.bar button{font:inherit;font-size:14px;color:var(--text);background:transparent;border:1px solid var(--bar-line);border-radius:6px;padding:6px 10px;min-height:34px;cursor:pointer}
.bar button:hover{border-color:var(--accent)}
.bar button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#04201d}
button:focus-visible{outline:2px solid var(--accent-2);outline-offset:2px}
.num{font-variant-numeric:tabular-nums;color:var(--muted);font-size:14px;min-width:64px;text-align:center}
.ttl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-size:14px;padding:0 8px}
.panel{position:absolute;z-index:20;background:rgba(11,31,58,.97);color:var(--text);border:1px solid var(--bar-line);border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.notes{left:50%;transform:translateX(-50%);bottom:12px;width:min(900px,calc(100% - 24px));max-height:38%;overflow:auto;padding:14px 18px;font-size:16px;line-height:1.45}
.notes h4,.outline h4{margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-2);font-weight:700}
.outline{top:10px;right:10px;bottom:10px;width:min(420px,calc(100% - 20px));overflow:auto;padding:12px}
.outline ol{list-style:none;margin:0;padding:0}
.outline button{display:flex;gap:10px;width:100%;text-align:left;background:transparent;border:0;border-radius:6px;color:var(--text);font:inherit;font-size:15px;padding:6px 8px;cursor:pointer}
.outline button:hover{background:#12305a}
.outline button.cur{background:var(--accent);color:#04201d}
.outline .n{flex:none;width:28px;color:var(--muted);font-variant-numeric:tabular-nums}.outline button.cur .n{color:#04201d}
.outline li.part button{font-weight:700;color:var(--accent-2);margin-top:8px}
.help{left:50%;top:50%;transform:translate(-50%,-50%);padding:18px 22px;font-size:16px;line-height:1.7}
.help kbd{background:#12305a;border:1px solid var(--bar-line);border-radius:4px;padding:1px 7px;font-family:var(--mono);font-size:14px}
@media (max-width:640px){.ttl{display:none}.bar button .lbl{display:none}}
@media (prefers-reduced-motion:reduce){.slide.active,.slide.active .a,.slide.active .flow{animation:none!important}}
`;

const JS = String.raw`
(function(){
  var slides=[].slice.call(document.querySelectorAll('.slide')),N=slides.length,cur=0;
  var $=function(id){return document.getElementById(id)};
  var stage=$('stage'),wrap=$('stagewrap'),num=$('num'),ttl=$('ttl'),prog=$('prog');
  var notes=$('notes'),ntext=$('ntext'),outline=$('outline'),olist=$('olist'),help=$('help');
  function fit(){var k=Math.min(wrap.clientWidth/1333,wrap.clientHeight/750)*0.985;stage.style.transform='translate(-50%,-50%) scale('+k+')'}
  function show(n){
    n=Math.max(0,Math.min(N-1,n));
    slides[cur].classList.remove('active');cur=n;
    var s=slides[cur];void s.offsetWidth;s.classList.add('active');
    num.textContent=(cur+1)+' / '+N;ttl.textContent=s.getAttribute('data-title');
    prog.style.width=((cur+1)/N*100)+'%';
    ntext.textContent=s.getAttribute('data-notes')||'No speaker notes for this slide.';
    var items=olist.querySelectorAll('button');for(var i=0;i<items.length;i++){items[i].classList.toggle('cur',i===cur)}
    try{history.replaceState(null,'','#s'+(cur+1))}catch(e){}
  }
  function fromHash(){var m=/^#s(\d+)$/.exec(location.hash||'');return m?parseInt(m[1],10)-1:0}
  function toggle(el,btn){el.hidden=!el.hidden;if(btn)btn.setAttribute('aria-pressed',String(!el.hidden))}
  slides.forEach(function(s,i){
    var li=document.createElement('li');if(s.hasAttribute('data-part'))li.className='part';
    var b=document.createElement('button');b.type='button';
    b.innerHTML='<span class="n">'+(i+1)+'</span><span></span>';
    b.lastChild.textContent=s.getAttribute('data-title');
    b.addEventListener('click',function(){show(i);outline.hidden=true;$('bOutline').setAttribute('aria-pressed','false')});
    li.appendChild(b);olist.appendChild(li);
  });
  $('bPrev').onclick=$('hitL').onclick=function(){show(cur-1)};
  $('bNext').onclick=$('hitR').onclick=function(){show(cur+1)};
  $('bNotes').onclick=function(){toggle(notes,$('bNotes'))};
  $('bOutline').onclick=function(){toggle(outline,$('bOutline'))};
  $('bFull').onclick=function(){try{if(document.fullscreenElement){document.exitFullscreen()}else{(document.documentElement.requestFullscreen||function(){return Promise.reject()}).call(document.documentElement).catch(function(){})}}catch(e){}};
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var k=e.key;
    if(k==='ArrowRight'||k==='PageDown'||k===' '||k==='Enter'){e.preventDefault();show(cur+1)}
    else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'){e.preventDefault();show(cur-1)}
    else if(k==='Home'){show(0)}else if(k==='End'){show(N-1)}
    else if(k==='n'||k==='N'){toggle(notes,$('bNotes'))}
    else if(k==='o'||k==='O'||k==='g'||k==='G'){toggle(outline,$('bOutline'))}
    else if(k==='f'||k==='F'){$('bFull').click()}
    else if(k==='r'||k==='R'){show(cur)}
    else if(k==='?'){help.hidden=!help.hidden}
    else if(k==='Escape'){notes.hidden=outline.hidden=help.hidden=true;$('bNotes').setAttribute('aria-pressed','false');$('bOutline').setAttribute('aria-pressed','false')}
  });
  var sx=null;
  wrap.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
  wrap.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50)show(cur+(dx<0?1:-1))},{passive:true});
  window.addEventListener('resize',fit);window.addEventListener('hashchange',function(){show(fromHash())});
  fit();show(fromHash());
})();
`;

function build(p) {
  const slides = p.slides.map(slideHtml);
  const defs = [...markers].map(c => {
    const id = c.replace("#", "m");
    const tri = '<path d="M0,0 L10,5 L0,10 z" fill="' + c + '"/>';
    return '<marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">' + tri + "</marker>" +
      '<marker id="' + id + 's" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">' + tri + "</marker>";
  }).join("");
  const body = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + defs + "</defs></svg>" +
    '<div class="app"><main class="stagewrap" id="stagewrap"><div class="stage" id="stage">' + slides.join("") + "</div>" +
    '<button class="hit l" id="hitL" type="button" aria-label="Previous slide">&#8249;</button><button class="hit r" id="hitR" type="button" aria-label="Next slide">&#8250;</button>' +
    '<div class="panel notes" id="notes" hidden><h4>Speaker notes</h4><div id="ntext"></div></div>' +
    '<aside class="panel outline" id="outline" hidden><h4>Outline</h4><ol id="olist"></ol></aside>' +
    '<div class="panel help" id="help" hidden><b>Keyboard</b><br><kbd>&rarr;</kbd> <kbd>Space</kbd> next &nbsp; <kbd>&larr;</kbd> previous<br><kbd>N</kbd> notes &nbsp; <kbd>O</kbd> outline &nbsp; <kbd>F</kbd> fullscreen<br><kbd>R</kbd> replay animation &nbsp; <kbd>Esc</kbd> close</div></main>' +
    '<nav class="bar" aria-label="Slide controls"><div class="prog" id="prog"></div>' +
    '<button id="bPrev" type="button" aria-label="Previous slide">&larr;</button><span class="num" id="num">1</span><button id="bNext" type="button" aria-label="Next slide">&rarr;</button>' +
    '<span class="ttl" id="ttl"></span>' +
    '<button id="bNotes" type="button" aria-pressed="false">Notes<span class="lbl"></span></button><button id="bOutline" type="button" aria-pressed="false">Outline</button><button id="bFull" type="button">Full screen</button></nav></div>' +
    "<script>" + JS + "</script>";
  const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Carlito:wght@400;700&family=Inconsolata:wght@400;700&display=swap">';
  const head = "<title>Hello, Server</title>" + fonts + "<style>" + CSS + "</style>";
  const standalone = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    head.replace("<title>Hello, Server</title>", "<title>Hello, Server: A Journey from Telnet to Microservices</title>") +
    "</head><body>" + body + "</body></html>";
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), standalone);
  if (FRAGMENT_OUT) fs.writeFileSync(FRAGMENT_OUT, head + body);
  console.log("wrote", path.join(OUT_DIR, "index.html"), "slides:", p.slides.length, "bytes:", standalone.length, FRAGMENT_OUT ? "fragment: " + FRAGMENT_OUT : "");
}

// Intercept require("pptxgenjs") and run the slide definitions.
const origLoad = Module._load;
Module._load = function (request, ...rest) { return request === "pptxgenjs" ? Pres : origLoad.call(this, request, ...rest); };
require("./build.js");

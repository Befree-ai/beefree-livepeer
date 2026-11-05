// Homepage hero: the poster globe with its own photos trading places and going LIVE by city.
export default function befreeHeroGlobe(hero: HTMLElement, SPRITE: string): () => void {
  const stageEl = hero.querySelector<HTMLElement>(".stage"), layerEl = hero.querySelector<HTMLElement>(".stage .tiles");
  if (!stageEl || !layerEl) return () => {};
  const stage: HTMLElement = stageEl, layer: HTMLElement = layerEl;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AR = 1672 / 808, GX = 1107 / 1672, GRX = 370 / 1672;
  const timers: number[] = [];

  // Size the stage so the globe sits beside the copy on desktop and under it on phones
  function layout() {
    const hw = hero.clientWidth, hh = hero.clientHeight;
    let w, h, left, top;
    const copy = hero.querySelector(".hero-copy");
    if (hw < 1000) {
      w = Math.min(hw, 760) * 1.95; h = w / AR; left = hw * 0.5 - w * GX; top = hh - h;
      hero.style.removeProperty("--copy-max");
    } else {
      w = Math.max(hw, Math.min(hh * AR, (hw + 30) / (GX + GRX)));
      h = w / AR; left = 0; top = hh - h;
      const copyLeft = copy ? copy.getBoundingClientRect().left - hero.getBoundingClientRect().left : 40;
      hero.style.setProperty("--copy-max", Math.max(320, Math.min(600, w * (GX - GRX) - 20 - copyLeft)) + "px");
    }
    stage.style.width = w + "px"; stage.style.height = h + "px"; stage.style.left = left + "px"; stage.style.top = top + "px";
    hero.style.setProperty("--stage-h", h + "px");
  }
  layout();
  let lastH = 0;
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(function () { if (Math.abs(hero.clientHeight - lastH) > 1) { lastH = hero.clientHeight; layout(); } }) : null;
  if (ro) ro.observe(hero); else window.addEventListener("resize", layout);

  // The poster's own photo tiles. Photos trade places with each other (never duplicated)
  // and tiles pop forward LIVE with their city.
  const SLOTS: [number, number, number, number, string][] = [
    [830,103,940,180,"New York"],[1038,104,1135,175,"London"],[944,166,1040,240,"Toronto"],[1218,67,1285,121,"Istanbul"],
    [1310,122,1407,195,"Tokyo"],[1198,180,1288,242,"Delhi"],[1446,182,1556,268,"Singapore"],[946,252,1074,336,"Madrid"],
    [1162,276,1240,357,"Dubai"],[1300,312,1420,406,"Mumbai"],[1102,378,1208,452,"Nairobi"],[828,408,925,474,"São Paulo"],
    [1356,457,1444,523,"Sydney"],[705,243,772,294,"Los Angeles"]
  ];
  const NT = SLOTS.length, face: number[] = SLOTS.map(function (_, i) { return i; }), busy: Record<number, number> = {}, tiles: { el: HTMLDivElement; img: HTMLElement }[] = [];
  SLOTS.forEach(function (b) {
    const el = document.createElement("div");
    el.className = "ptile";
    el.style.left = (b[0] / 1672 * 100) + "%"; el.style.top = (b[1] / 808 * 100) + "%";
    el.style.width = ((b[2] - b[0]) / 1672 * 100) + "%"; el.style.height = ((b[3] - b[1]) / 808 * 100) + "%";
    el.innerHTML = '<span class="img"></span><span class="cap"><i></i>LIVE · ' + b[4] + '</span>';
    layer.appendChild(el);
    tiles.push({ el: el, img: el.querySelector<HTMLElement>(".img")! });
  });
  function paint(i: number) {
    const img = tiles[i].img, n = face[i];
    img.style.backgroundImage = "url(" + SPRITE + ")";
    img.style.backgroundSize = (NT * 100) + "% 100%";
    img.style.backgroundPosition = (n / (NT - 1) * 100) + "% 0";
    tiles[i].el.classList.toggle("on", n !== i || tiles[i].el.classList.contains("live"));
  }
  function free() { const out = []; for (let i = 0; i < NT; i++) if (!busy[i]) out.push(i); return out; }

  // Two tiles fade, trade photos, and fade back in
  function swap() {
    const f = free(); if (f.length < 2) return;
    const a = f.splice(Math.floor(Math.random() * f.length), 1)[0], b = f[Math.floor(Math.random() * f.length)];
    busy[a] = busy[b] = 1;
    tiles[a].el.classList.add("fade"); tiles[b].el.classList.add("fade");
    timers.push(window.setTimeout(function () {
      const t = face[a]; face[a] = face[b]; face[b] = t; paint(a); paint(b);
      tiles[a].el.classList.remove("fade"); tiles[b].el.classList.remove("fade");
      timers.push(window.setTimeout(function () { delete busy[a]; delete busy[b]; }, 700));
    }, 450));
  }
  // A tile pops forward with a LIVE tag and its city, then settles back
  function goLive() {
    const live = tiles.filter(function (t) { return t.el.classList.contains("live"); }).length;
    if (live >= 3) return;
    const hr = hero.getBoundingClientRect();
    const txt = Array.prototype.slice.call(hero.querySelectorAll(".hero-copy > *")).map(function (e: Element) { return e.getBoundingClientRect(); });
    const f = free().filter(function (k) {
      const r = tiles[k].el.getBoundingClientRect(); const cx = (r.left + r.right) / 2 - hr.left;
      const p = 0.35 * r.width;
      const hitsText = txt.some(function (q: DOMRect) { return q.width > 0 && r.left - p < q.right && r.right + p > q.left && r.top - p < q.bottom && r.bottom + p > q.top; });
      return !hitsText && cx > 70 && cx < hr.width - 70 && r.top - hr.top > 30;
    });
    if (!f.length) return;
    const i = f[Math.floor(Math.random() * f.length)];
    busy[i] = 1; tiles[i].el.classList.add("live"); paint(i);
    timers.push(window.setTimeout(function () {
      tiles[i].el.classList.remove("live"); paint(i);
      timers.push(window.setTimeout(function () { delete busy[i]; }, 600));
    }, 3600));
  }
  tiles.forEach(function (_, i) { paint(i); });
  if (!reduce) {
    goLive(); timers.push(window.setTimeout(goLive, 700));
    timers.push(window.setInterval(goLive, 1500));
    timers.push(window.setInterval(swap, 1900));
  }
  return function () { timers.forEach(function (h) { clearTimeout(h); clearInterval(h); }); if (ro) ro.disconnect(); else window.removeEventListener("resize", layout); layer.innerHTML = ""; };
}

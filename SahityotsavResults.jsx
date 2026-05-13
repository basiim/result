import { useState, useEffect, useRef } from "react";

// ── Font injection ──────────────────────────────────────────────────────────
(function () {
  if (document.getElementById("sf-gf")) return;
  const l = document.createElement("link");
  l.id = "sf-gf";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Alexandria:wght@400;500;600;700&family=DM+Serif+Display:ital@1&display=swap";
  document.head.appendChild(l);

  const s = document.createElement("style");
  s.textContent = `@font-face {
    font-family: "Pixelated Elegance";
    src: url("/PixelatedEleganceRegular-ovawB.ttf") format("truetype");
    font-weight: 400;
    font-style: normal;
  }`;
  document.head.appendChild(s);
})();

// roundRect polyfill
if (typeof CanvasRenderingContext2D !== "undefined" &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rad = Math.min(typeof r === "number" ? r : r[0], Math.min(w, h) / 2);
    this.beginPath();
    this.moveTo(x + rad, y);
    this.lineTo(x + w - rad, y);
    this.arcTo(x + w, y, x + w, y + rad, rad);
    this.lineTo(x + w, y + h - rad);
    this.arcTo(x + w, y + h, x + w - rad, y + h, rad);
    this.lineTo(x + rad, y + h);
    this.arcTo(x, y + h, x, y + h - rad, rad);
    this.lineTo(x, y + rad);
    this.arcTo(x, y, x + rad, y, rad);
    this.closePath();
    return this;
  };
}

// ── Constants ───────────────────────────────────────────────────────────────
const CATS = ["Lower Primary","Upper Primary","High School","Higher Secondary","Junior","Senior"];
const PLACES = ["Adivaram","Poolakkathadam","Millumpadi"];
const PTS = [5, 3, 1];
const DARK = "#1a2e28", ORANGE = "#c4440a", BG = "#f2e8d0";
const PLACE_COLS = { Adivaram: "#2d7a4f", Poolakkathadam: "#8b5520", Millumpadi: ORANGE };

// ── Canvas helpers ──────────────────────────────────────────────────────────
function sunrays(ctx, W) {
  const ox = W * 0.73, oy = -110;
  ctx.save();
  for (let i = 0; i < 32; i++) {
    ctx.globalAlpha = 0.25 + (i % 3) * 0.08;
    ctx.strokeStyle = "#cdc090";
    ctx.lineWidth = 1;
    const a = -0.68 + i * ((Math.PI * 1.56) / 31);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a) * 2400, oy + Math.sin(a) * 2400);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function flameTongue(ctx, cx, cy, s, dx, ts, clr) {
  const h = 570 * s * ts, w = 190 * s * ts, tx = cx + dx * s;
  ctx.fillStyle = clr;
  ctx.beginPath();
  ctx.moveTo(tx, cy);
  ctx.bezierCurveTo(tx - w * 0.5, cy - h * 0.22, tx - w * 0.4, cy - h * 0.5, tx - w * 0.04, cy - h * 0.7);
  ctx.bezierCurveTo(tx + w * 0.04, cy - h * 0.78, tx - w * 0.06, cy - h * 0.88, tx + w * 0.02, cy - h);
  ctx.bezierCurveTo(tx + w * 0.18, cy - h * 0.86, tx + w * 0.28, cy - h * 0.76, tx + w * 0.24, cy - h * 0.63);
  ctx.bezierCurveTo(tx + w * 0.44, cy - h * 0.7, tx + w * 0.54, cy - h * 0.78, tx + w * 0.44, cy - h * 0.88);
  ctx.bezierCurveTo(tx + w * 0.7, cy - h * 0.74, tx + w * 0.76, cy - h * 0.56, tx + w * 0.6, cy - h * 0.42);
  ctx.bezierCurveTo(tx + w * 0.8, cy - h * 0.36, tx + w * 0.86, cy - h * 0.2, tx + w * 0.7, cy - h * 0.06);
  ctx.bezierCurveTo(tx + w * 0.62, cy, tx + w * 0.38, cy, tx, cy);
  ctx.closePath();
  ctx.fill();
}

function drawFlame(ctx, cx, cy, s) {
  const layers = [
    [0, 1.0, "#7a1200"], [13, 0.88, "#a82600"],
    [25, 0.75, "#c4440a"], [36, 0.62, "#d4580a"],
    [46, 0.49, "#e07018"], [55, 0.37, "#f09028"],
  ];
  layers.forEach(([dx, ts, clr]) => flameTongue(ctx, cx, cy, s, dx, ts, clr));
}

const SPX = [
  [-182,-598,18,0],[-148,-644,14,2],[-92,-672,20,0],[-28,-688,12,1],
  [34,-704,16,0],[98,-682,10,2],[158,-662,18,1],[202,-622,14,0],
  [238,-584,20,2],[258,-528,16,1],[270,-470,12,0],[275,-412,18,2],
  [-212,-542,16,1],[-232,-478,12,0],[-244,-412,18,2],[-250,-348,14,1],
  [-248,-285,10,0],[78,-734,8,1],[-52,-722,10,0],[178,-700,8,2],
  [292,-352,12,0],[-258,-222,10,1],[260,-288,14,0],[288,-220,16,2],
  [54,-278,22,3],[82,-242,18,3],[32,-212,24,3],[112,-202,16,3],
  [-18,-178,20,3],[142,-168,14,3],[62,-148,22,3],[172,-142,18,3],
  [-48,-122,16,3],[202,-118,12,3],[102,-102,20,3],[132,-82,16,3],
  [52,-62,18,3],[-22,-52,14,3],[82,-42,20,3],[162,-68,10,3],
  [-68,-92,12,0],[240,-162,16,3],[220,-242,12,0],
];
const SPXC = ["#c4440a", "#f08030", "#d4500a", "#1a2e28"];

function scatter(ctx, cx, cy, s) {
  SPX.forEach(([rx, ry, sz, ci]) => {
    ctx.fillStyle = SPXC[ci];
    ctx.globalAlpha = ci === 3 ? 0.88 : 0.92;
    ctx.fillRect(cx + rx * s, cy + ry * s, sz * s, sz * s);
  });
  ctx.globalAlpha = 1;
}

function drawPen(ctx, cx, cy, s) {
  const bw = 42 * s, bh = 268 * s;
  ctx.save();
  ctx.fillStyle = "#1a3028";
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, cy - bh, bw, bh * 0.82, 4 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy - bh, bw / 2 + 2, 12 * s, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#c8940a";
  ctx.fillRect(cx - bw / 2 - 3, cy - bh * 0.28, bw + 6, 14 * s);
  ctx.fillStyle = "#152822";
  ctx.beginPath();
  ctx.roundRect(cx - bw * 0.42, cy - bh * 0.18, bw * 0.84, bh * 0.18, 2);
  ctx.fill();
  ctx.fillStyle = "#1a3028";
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.38, cy - 70 * s);
  ctx.lineTo(cx + bw * 0.38, cy - 70 * s);
  ctx.lineTo(cx + 12 * s, cy + 10 * s);
  ctx.lineTo(cx - 12 * s, cy + 10 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c8940a";
  ctx.beginPath();
  ctx.moveTo(cx - 14 * s, cy - 22 * s);
  ctx.lineTo(cx + 14 * s, cy - 22 * s);
  ctx.lineTo(cx, cy + 32 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 60 * s);
  ctx.lineTo(cx, cy + 30 * s);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.ellipse(cx - bw * 0.2, cy - bh * 0.55, bw * 0.1, bh * 0.22, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawInkBottle(ctx, cx, cy, s) {
  ctx.save();
  ctx.fillStyle = "#1a3028";
  ctx.beginPath();
  ctx.roundRect(cx - 34 * s, cy - 80 * s, 68 * s, 80 * s, 4 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 34 * s, cy - 80 * s);
  ctx.lineTo(cx - 20 * s, cy - 107 * s);
  ctx.lineTo(cx + 20 * s, cy - 107 * s);
  ctx.lineTo(cx + 34 * s, cy - 80 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - 14 * s, cy - 131 * s, 28 * s, 26 * s);
  ctx.fillStyle = "#243c30";
  ctx.beginPath();
  ctx.roundRect(cx - 16 * s, cy - 147 * s, 32 * s, 18 * s, 3);
  ctx.fill();
  ctx.fillStyle = "#0a1a14";
  ctx.beginPath();
  ctx.roundRect(cx - 30 * s, cy - 42 * s, 60 * s, 44 * s, [0, 0, 4 * s, 4 * s]);
  ctx.fill();
  ctx.fillStyle = "#2a4838";
  ctx.beginPath();
  ctx.roundRect(cx - 26 * s, cy - 72 * s, 52 * s, 30 * s, 2);
  ctx.fill();
  ctx.restore();
}

function drawBook(ctx, bx, by, s, W) {
  ctx.save();
  ctx.fillStyle = "#e8d8a0";
  ctx.beginPath();
  ctx.moveTo(W * 0.5, by + 15 * s);
  ctx.bezierCurveTo(W * 0.53, by - 40 * s, W * 0.60, by - 60 * s, bx - 18 * s, by - 54 * s);
  ctx.bezierCurveTo(bx, by - 54 * s, bx, by - 40 * s, bx, by - 38 * s);
  ctx.bezierCurveTo(bx, by - 10 * s, W * 0.55, by, W * 0.5, by + 15 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ddd0a0";
  ctx.beginPath();
  ctx.moveTo(bx, by - 38 * s);
  ctx.bezierCurveTo(bx, by - 54 * s, bx + 20 * s, by - 54 * s, bx + 24 * s, by - 54 * s);
  ctx.bezierCurveTo(W * 0.88, by - 60 * s, W * 0.96, by - 38 * s, W * 0.99, by + 15 * s);
  ctx.bezierCurveTo(W * 0.81, by + 8 * s, W * 0.65, by + 5 * s, bx, by - 38 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#a89860";
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(bx, by - 38 * s);
  ctx.bezierCurveTo(bx - 2, by - 20 * s, bx - 2, by - 5 * s, bx, by + 5 * s);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawIllustration(ctx, W, H) {
  const cx = 710, cy = 912, s = 1.0;
  drawBook(ctx, cx, H - 28, s, W);
  scatter(ctx, cx, cy, s);
  drawFlame(ctx, cx, cy, s);
  drawPen(ctx, cx + 62, cy + 64, s);
  drawInkBottle(ctx, cx - 88, cy + 70, s);
}

function spaced(ctx, txt, x, y, sp = 5) {
  let cx = x;
  for (const c of txt) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + sp;
  }
}

function wrapped(ctx, txt, x, y, mw, lh, align = "left") {
  const words = (txt || "").split(" ");
  let line = "", cy = y;
  words.forEach((w) => {
    const t = line + (line ? " " : "") + w;
    if (ctx.measureText(t).width > mw && line) {
      ctx.fillText(line, align === "right" ? x + mw - ctx.measureText(line).width : x, cy);
      line = w;
      cy += lh;
    } else {
      line = t;
    }
  });
  if (line) ctx.fillText(line, align === "right" ? x + mw - ctx.measureText(line).width : x, cy);
  return cy;
}

async function renderPoster(canvas, data) {
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3500))]);
    await Promise.allSettled([
      document.fonts.load('700 60px "Space Grotesk"'),
      document.fonts.load('700 46px "Alexandria"'),
      document.fonts.load('50px "Pixelated Elegance"'),
      document.fonts.load('italic 700 80px "DM Serif Display"'),
    ]);
  } catch (e) {}

  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1080;
  canvas.width = W;
  canvas.height = H;

  // Background — load result.png and draw it
  const bgImg = await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "/result.png";
  });

  if (bgImg) {
    // Cover the canvas maintaining aspect ratio
    const scale = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const dx = (W - bgImg.naturalWidth * scale) / 2;
    const dy = (H - bgImg.naturalHeight * scale) / 2;
    ctx.drawImage(bgImg, dx, dy, bgImg.naturalWidth * scale, bgImg.naturalHeight * scale);
  } else {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    sunrays(ctx, W);
    drawIllustration(ctx, W, H);
  }

  ctx.letterSpacing = "2px";

  // ── RESULT LABEL ─────────────────────────────────────────────────────
  ctx.save();
  ctx.font = '19.65px "Pixelated Elegance",monospace';
  ctx.fillStyle = DARK;
  spaced(ctx, `RESULT ${String(data.resultNum).padStart(2, "0")}`, 108, 228, 8);
  ctx.restore();

  // ── CATEGORY ─────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = '700 38.96px "Space Grotesk",sans-serif';
  ctx.fillStyle = DARK;
  ctx.fillText(data.category + (data.isGirls ? " (Girls)" : ""), 108, 272);
  ctx.restore();

  // ── COMPETITION ───────────────────────────────────────────────────────
  ctx.save();
  ctx.font = '700 38.96px "Space Grotesk",sans-serif';
  ctx.fillStyle = DARK;
  const compEndY = wrapped(ctx, data.competition || "", 108, 322, 520, 70);
  ctx.restore();

  // ── RANKINGS ─────────────────────────────────────────────────────────
  const rsy = Math.max(compEndY + 70, 435);
  const rgap = 125;

  data.participants.forEach((p, i) => {
    if (!p.name?.trim()) return;
    const ry = rsy + i * rgap;

    ctx.save();
    ctx.font = '72px "Pixelated Elegance",monospace';
    ctx.fillStyle = ORANGE;
    ctx.fillText(String(i + 1).padStart(2, "0"), 108, ry + 52);
    ctx.restore();

    ctx.save();
    ctx.font = '600 39px "Alexandria",sans-serif';
    ctx.fillStyle = DARK;
    ctx.fillText(p.name, 230, ry + 30);
    ctx.restore();

    ctx.save();
    ctx.font = '600 25px "Alexandria",sans-serif';
    ctx.fillStyle = DARK;
    ctx.fillText(p.place.toUpperCase(), 230, ry + 60);
    ctx.restore();
  });

}

// ── Shared input style ──────────────────────────────────────────────────────
const INP = {
  width: "100%", padding: "10px 12px",
  border: "1.5px solid #e0d0b8", borderRadius: 10,
  fontSize: 14, fontFamily: '"Space Grotesk",sans-serif',
  background: "#fdfaf5", boxSizing: "border-box", color: "#333", outline: "none",
};

// ── Sub-components ──────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={{
      background: "white", borderRadius: 14, padding: 16,
      boxShadow: "0 2px 14px rgba(0,0,0,.07)", border: "1.5px solid #ede0ca",
    }}>
      {title && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: ORANGE,
          letterSpacing: 1.5, marginBottom: 14,
        }}>{title}</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: label ? "90px 1fr" : "1fr",
      gap: 10, alignItems: "center",
    }}>
      {label && <span style={{ fontSize: 12, fontWeight: 600, color: "#999" }}>{label}</span>}
      {children}
    </div>
  );
}

function HistoryTab({ hist, onDelete, onDeleteAll, onDownload }) {
  if (!hist.length)
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#a09080" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>No results saved yet</div>
        <div style={{ fontSize: 13, marginTop: 4, color: "#c0b0a0" }}>
          Create your first result to see it here
        </div>
      </div>
    );

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 12, color: "#aaa", fontWeight: 700, letterSpacing: 0.5 }}>
          {hist.length} RESULT{hist.length !== 1 ? "S" : ""} SAVED
        </div>
        {hist.length > 0 && (
          <button
            onClick={onDeleteAll}
            style={{
              background: "none", border: "1.5px solid #e0d0b8", borderRadius: 8,
              padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#c44",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >Delete All</button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {hist.map((r) => (
          <div key={r.id} style={{
            background: "white", borderRadius: 14, padding: 14,
            display: "flex", gap: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,.07)", border: "1.5px solid #ede0ca",
          }}>
            {r.thumb && (
              <img src={r.thumb} alt="" style={{
                width: 72, height: 72, borderRadius: 8,
                objectFit: "cover", flexShrink: 0, border: "1.5px solid #e0d0b8",
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>
                RESULT {String(r.resultNum).padStart(2, "0")}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 1 }}>
                {r.category}
              </div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{r.competition}</div>
              {r.participants
                .filter((p) => p.name?.trim())
                .map((p, i) => (
                  <div key={i} style={{ fontSize: 12, display: "flex", gap: 5, marginBottom: 2 }}>
                    <span style={{ color: ORANGE, fontWeight: 700 }}>{i + 1}.</span>
                    <span style={{ fontWeight: 600, color: "#444" }}>{p.name}</span>
                    <span style={{ color: "#bbb" }}>—</span>
                    <span style={{ color: "#777" }}>{p.place}</span>
                    <span style={{ color: "#aaa" }}>Gr: {p.grade}</span>
                  </div>
                ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => onDownload(r)}
                style={{
                  background: "#e8f0ea", border: "1.5px solid #c8d8d0",
                  borderRadius: 8, cursor: "pointer",
                  color: DARK, fontSize: 14, fontWeight: 700,
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#d0e0d8"; }}
                onMouseLeave={(e) => { e.target.style.background = "#e8f0ea"; }}
                title="Download PNG"
              >⬇</button>
              <button
                onClick={() => onDelete(r.id)}
                style={{
                  background: "#fce8e8", border: "1.5px solid #f5c8c8",
                  borderRadius: 8, cursor: "pointer",
                  color: "#c44", fontSize: 16, fontWeight: 700,
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#f5d0d0"; e.target.style.color = "#a22"; }}
                onMouseLeave={(e) => { e.target.style.background = "#fce8e8"; e.target.style.color = "#c44"; }}
                title="Delete"
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsTab({ stats, ranked, maxPts, totalEvents }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary banner */}
      <div style={{
        background: DARK, borderRadius: 14, padding: "16px 20px",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: ORANGE }}>{totalEvents}</div>
          <div style={{ fontSize: 10, color: "#80a898", letterSpacing: 0.5, marginTop: 2 }}>EVENTS</div>
        </div>
        {PLACES.map((p) => (
          <div key={p} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "white" }}>{stats[p].pts}</div>
            <div style={{ fontSize: 10, color: "#80a898", letterSpacing: 0.5, marginTop: 2 }}>
              {p.slice(0, 7).toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <Card title="LEADERBOARD — TOTAL POINTS">
        {ranked.map((place, idx) => {
          const st = stats[place];
          const pct = maxPts > 0 ? (st.pts / maxPts) * 100 : 0;
          const medal = ["🥇", "🥈", "🥉"][idx] || "  ";
          const pc = PLACE_COLS[place] || ORANGE;
          return (
            <div key={place}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{medal}</span>
                  <span style={{ fontWeight: 700, fontSize: 17, color: DARK }}>{place}</span>
                </div>
                <div>
                  <span style={{ fontSize: 26, fontWeight: 800, color: pc }}>{st.pts}</span>
                  <span style={{ fontSize: 12, color: "#bbb", marginLeft: 4 }}>pts</span>
                </div>
              </div>
              <div style={{
                height: 10, background: "#f0e8d8", borderRadius: 5,
                overflow: "hidden", marginBottom: 8,
              }}>
                <div style={{
                  height: "100%", borderRadius: 5, background: pc,
                  width: `${pct}%`, transition: "width .5s",
                }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
                {[["🥇", st.f, 5], ["🥈", st.s, 3], ["🥉", st.t, 1]].map(([ic, cnt, pts]) => (
                  <span key={pts} style={{ fontSize: 12, color: "#888" }}>
                    {ic} <strong style={{ color: DARK }}>{cnt}</strong> × {pts}pt
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Points reference */}
      <Card title="POINTS SYSTEM">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["🥇", "1st", 5, ORANGE], ["🥈", "2nd", 3, "#888"], ["🥉", "3rd", 1, "#aaa"]].map(
            ([ic, lb, pt, cl]) => (
              <div key={lb} style={{
                background: "#faf5ee", borderRadius: 10, padding: "12px 8px",
                textAlign: "center", border: "1.5px solid #ece0cc",
              }}>
                <div style={{ fontSize: 28 }}>{ic}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginTop: 4 }}>
                  {lb} Place
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: cl, marginTop: 2 }}>{pt}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>points</div>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("create");
  const EMPTY_FORM = {
    category: "Senior", isGirls: false, competition: "", resultNum: 1,
    participants: [
      { name: "", place: "Adivaram", grade: "" },
      { name: "", place: "Poolakkathadam", grade: "" },
      { name: "", place: "Millumpadi", grade: "" },
    ],
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [hist, setHist] = useState([]);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const cvs = useRef(null);
  const timer = useRef(null);

  // Load stored history
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("sf_hist");
        if (r?.value) setHist(JSON.parse(r.value));
      } catch {}
    })();
  }, []);

  // Auto-preview with debounce
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (cvs.current) {
        renderPoster(cvs.current, form)
          .then(() => setPreview(cvs.current.toDataURL("image/jpeg", 0.88)))
          .catch(() => {});
      }
    }, 450);
    return () => clearTimeout(timer.current);
  }, [form]);

  const saveHist = async (h) => {
    await window.storage.set("sf_hist", JSON.stringify(h));
    setHist(h);
  };

  const upd = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const updP = (i, f, v) =>
    setForm((x) => {
      const ps = [...x.participants];
      ps[i] = { ...ps[i], [f]: v };
      return { ...x, participants: ps };
    });

  const handleSave = async () => {
    if (!form.competition.trim() || busy) return;
    setBusy(true);
    try {
      await renderPoster(cvs.current, form);
      const full = cvs.current.toDataURL("image/jpeg", 0.82);
      const tc = document.createElement("canvas");
      tc.width = tc.height = 180;
      const img = new Image();
      await new Promise((r) => { img.onload = r; img.src = full; });
      tc.getContext("2d").drawImage(img, 0, 0, 180, 180);
      const thumb = tc.toDataURL("image/jpeg", 0.6);
      const rec = {
        id: Date.now(),
        resultNum: form.resultNum,
        category: form.category + (form.isGirls ? " (Girls)" : ""),
        competition: form.competition,
        participants: form.participants.map((p) => ({ ...p })),
        thumb,
      };
      const nh = [rec, ...hist];
      await saveHist(nh);
      upd("resultNum", form.resultNum + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.download = `result_${String(form.resultNum).padStart(2, "0")}_${form.category.replace(/\s+/g, "_")}.jpg`;
    a.href = preview;
    a.click();
  };

  const delRec = async (id) => {
    const nh = hist.filter((r) => r.id !== id);
    await saveHist(nh);
  };

  const handleDeleteAll = async () => {
    await saveHist([]);
  };

  const handleDownloadFromHistory = async (rec) => {
    if (!cvs.current) return;
    const formData = {
      category: rec.category.replace(" (Girls)", ""),
      isGirls: rec.category.includes("(Girls)"),
      competition: rec.competition,
      resultNum: rec.resultNum,
      participants: rec.participants.map((p) => ({ ...p })),
    };
    await renderPoster(cvs.current, formData);
    const dataUrl = cvs.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.download = `result_${String(rec.resultNum).padStart(2, "0")}_${rec.category.replace(/\s+/g, "_")}.png`;
    a.href = dataUrl;
    a.click();
  };

  // Stats computation
  const stats = PLACES.reduce(
    (a, p) => ({ ...a, [p]: { f: 0, s: 0, t: 0, pts: 0 } }), {}
  );
  hist.forEach((r) =>
    r.participants.forEach((p, i) => {
      if (p.name?.trim() && PLACES.includes(p.place)) {
        const k = ["f", "s", "t"][i];
        if (k) {
          stats[p.place][k]++;
          stats[p.place].pts += (PTS[i] || 0) + (Number(p.grade) || 0);
        }
      }
    })
  );
  const maxPts = Math.max(...Object.values(stats).map((s) => s.pts), 1);
  const ranked = [...PLACES].sort((a, b) => stats[b].pts - stats[a].pts);

  const TABS = [
    { id: "create", icon: "✏️", label: "Create" },
    { id: "history", icon: "📋", label: "Results" },
    { id: "stats", icon: "📊", label: "Stats" },
  ];

  return (
    <div style={{
      fontFamily: '"Space Grotesk",sans-serif',
      background: "#f8f3ea", minHeight: "100vh", paddingBottom: 74,
    }}>
      {/* Hidden canvas + font preloader */}
      <canvas ref={cvs} style={{ display: "none" }} />
      <div style={{ position: "absolute", opacity: 0, fontSize: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}>
        <span style={{ fontFamily: '"Pixelated Elegance"' }}>0</span>
        <span style={{ fontFamily: '"Alexandria"', fontWeight: 700 }}>0</span>
        <span style={{ fontFamily: '"DM Serif Display"', fontStyle: "italic", fontWeight: 700 }}>0</span>
      </div>

      {/* Header */}
      <div style={{
        background: DARK, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 10, color: "#80a898", letterSpacing: 2, fontWeight: 700 }}>
            SSF MASJID BAZAR UNIT
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
            <span style={{ color: ORANGE }}>Sahityotsav</span> Results
          </div>
        </div>
        <div style={{
          background: ORANGE, color: "white", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 1,
        }}>
          2026
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: 16 }}>

        {/* ── CREATE TAB ───────────────────────────────────────────────── */}
        {tab === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Poster preview */}
            <div style={{
              background: "white", borderRadius: 14, overflow: "hidden",
              boxShadow: "0 4px 22px rgba(0,0,0,.10)", border: "2px solid #e8dcc8",
            }}>
              {preview ? (
                <img src={preview} style={{ width: "100%", display: "block" }} alt="Poster preview" />
              ) : (
                <div style={{
                  aspectRatio: "1/1", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: BG, color: "#a09080", gap: 10,
                }}>
                  <div style={{ fontSize: 44 }}>🎨</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Fill details to preview poster</div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={busy || !form.competition.trim()}
                style={{
                  flex: 1, padding: "13px",
                  background: busy || !form.competition.trim() ? "#c8b8a8" : ORANGE,
                  color: "white", border: "none", borderRadius: 12,
                  fontFamily: "inherit", fontWeight: 700, fontSize: 15,
                  cursor: busy || !form.competition.trim() ? "not-allowed" : "pointer",
                  transition: "background .2s",
                }}
              >
                {busy ? "⏳ Saving..." : "💾 Save Result"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!preview}
                style={{
                  padding: "13px 18px",
                  background: preview ? DARK : "#c8b8a8",
                  color: "white", border: "none", borderRadius: 12,
                  fontSize: 18, cursor: preview ? "pointer" : "not-allowed",
                }}
                title="Download poster"
              >⬇️</button>
              <button
                onClick={() => setForm(EMPTY_FORM)}
                style={{
                  padding: "13px 18px",
                  background: "#c8b8a8",
                  color: "white", border: "none", borderRadius: 12,
                  fontSize: 18, cursor: "pointer",
                }}
                title="Clear all fields"
              >↺</button>
            </div>

            {/* Event details */}
            <Card title="EVENT DETAILS">
              <Row label="Result #">
                <input
                  type="number" min={1} value={form.resultNum}
                  onChange={(e) => upd("resultNum", parseInt(e.target.value) || 1)}
                  style={INP}
                />
              </Row>
              <Row label="Category">
                <select value={form.category} onChange={(e) => upd("category", e.target.value)} style={INP}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Row>
              <Row label="">
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox" checked={form.isGirls}
                    onChange={(e) => upd("isGirls", e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: ORANGE }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>Girls Category</span>
                </label>
              </Row>
              <Row label="Competition">
                <input
                  type="text" value={form.competition}
                  onChange={(e) => upd("competition", e.target.value)}
                  placeholder="e.g. E-Poster Designing"
                  style={INP}
                />
              </Row>
            </Card>

            {/* Participants */}
            {[["🥇", "1st Place"], ["🥈", "2nd Place"], ["🥉", "3rd Place"]].map(([ic, lbl], i) => (
              <Card key={i} title={`${ic} ${lbl}`}>
                <Row label="Name">
                  <input
                    type="text" value={form.participants[i].name}
                    onChange={(e) => updP(i, "name", e.target.value)}
                    placeholder="Participant name"
                    style={{
                      ...INP,
                      borderColor: form.participants[i].name.trim() ? "#b8e0c8" : "#e0d0b8",
                    }}
                  />
                </Row>
                <Row label="Place">
                  <select
                    value={form.participants[i].place}
                    onChange={(e) => updP(i, "place", e.target.value)}
                    style={INP}
                  >
                    {PLACES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Row>
                <Row label="Grade">
                  <input
                    type="number" min={0}
                    value={form.participants[i].grade}
                    onChange={(e) => updP(i, "grade", e.target.value)}
                    placeholder="Enter grade"
                    style={INP}
                  />
                </Row>
                {!form.participants[i].name.trim() && i > 0 && (
                  <div style={{
                    fontSize: 11, color: "#bbb", padding: "4px 6px",
                    background: "#faf5ee", borderRadius: 6,
                  }}>
                    Leave name blank to omit this rank from poster
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
        {tab === "history" && (
          <HistoryTab hist={hist} onDelete={delRec} onDeleteAll={handleDeleteAll} onDownload={handleDownloadFromHistory} />
        )}

        {/* ── STATS TAB ────────────────────────────────────────────────── */}
        {tab === "stats" && (
          <StatsTab
            stats={stats} ranked={ranked} maxPts={maxPts} totalEvents={hist.length}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: DARK, display: "flex",
        borderTop: `3px solid ${ORANGE}`, zIndex: 100,
      }}>
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
              background: tab === id ? ORANGE : "transparent",
              color: "white", fontFamily: "inherit",
              transition: "background .2s",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 2 }}>{icon}</div>
            <div style={{
              fontSize: 11,
              fontWeight: tab === id ? 700 : 400,
              letterSpacing: 0.5,
            }}>{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

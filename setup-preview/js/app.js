/* SetupView — logique principale (canvas, sélection, drag, presets, export). */
(function () {
  "use strict";

  const { CATALOG, roundRect } = window.SetupCatalog;
  const STORAGE_KEY = "setupview.scene.v1";

  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");

  /** @type {Array<Object>} liste ordonnée des éléments (du fond vers l'avant) */
  let items = [];
  let selectedId = null;
  let showGrid = true;
  let nextId = 1;

  // État de drag
  let drag = null; // { id, dx, dy } ou { creating:true, ... }

  /* ---------------- Catalogue (panneau gauche) ---------------- */
  function buildCatalog() {
    const list = document.getElementById("catalogList");
    list.innerHTML = "";
    Object.keys(CATALOG).forEach((type) => {
      const def = CATALOG[type];
      const el = document.createElement("div");
      el.className = "catalog-item";
      el.draggable = true;
      el.dataset.type = type;
      el.innerHTML = `<span class="emoji">${def.emoji}</span><span class="label">${def.label}</span>`;
      el.addEventListener("click", () => addItem(type));
      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", type);
      });
      list.appendChild(el);
    });
  }

  /* ---------------- Gestion des éléments ---------------- */
  function addItem(type, x, y) {
    const def = CATALOG[type];
    if (!def) return;
    const item = {
      id: nextId++,
      type,
      name: def.label,
      x: x != null ? x : canvas.width / 2,
      y: y != null ? y : canvas.height / 2,
      w: def.w,
      h: def.h,
      rot: 0,
      color: def.color
    };
    items.push(item);
    selectedId = item.id;
    render();
    syncPanels();
  }

  function getSelected() {
    return items.find((it) => it.id === selectedId) || null;
  }

  function deleteSelected() {
    if (selectedId == null) return;
    items = items.filter((it) => it.id !== selectedId);
    selectedId = null;
    render();
    syncPanels();
  }

  function duplicateSelected() {
    const s = getSelected();
    if (!s) return;
    const copy = Object.assign({}, s, { id: nextId++, x: s.x + 30, y: s.y + 30 });
    items.push(copy);
    selectedId = copy.id;
    render();
    syncPanels();
  }

  function bringToFront() {
    const s = getSelected();
    if (!s) return;
    items = items.filter((it) => it.id !== s.id);
    items.push(s);
    render();
  }

  function sendToBack() {
    const s = getSelected();
    if (!s) return;
    items = items.filter((it) => it.id !== s.id);
    items.unshift(s);
    render();
  }

  function rotateSelected(deg) {
    const s = getSelected();
    if (!s) return;
    s.rot = (s.rot + deg + 360) % 360;
    render();
    syncPanels();
  }

  /* ---------------- Rendu ---------------- */
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(120,140,200,0.08)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= canvas.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawItem(item, selected) {
    const def = CATALOG[item.type];
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate((item.rot * Math.PI) / 180);

    // ombre portée douce
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    // on dessine en mettant à l'échelle vers les dimensions courantes
    ctx.save();
    ctx.scale(item.w / def.w, item.h / def.h);
    def.draw(ctx, def.w, def.h, item.color);
    ctx.restore();

    ctx.shadowColor = "transparent";

    if (selected) {
      ctx.strokeStyle = "#5b8cff";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-item.w / 2 - 6, -item.h / 2 - 6, item.w + 12, item.h + 12);
      ctx.setLineDash([]);
      // poignée de rotation
      ctx.fillStyle = "#5b8cff";
      ctx.beginPath();
      ctx.arc(0, -item.h / 2 - 24, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // fond du plan
    ctx.fillStyle = "#10131f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (showGrid) drawGrid();
    items.forEach((it) => drawItem(it, it.id === selectedId));
  }

  /* ---------------- Hit testing ---------------- */
  function canvasPoint(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  // Transforme un point monde dans le repère local d'un élément (annule rotation).
  function toLocal(item, px, py) {
    const dx = px - item.x;
    const dy = py - item.y;
    const a = (-item.rot * Math.PI) / 180;
    return {
      x: dx * Math.cos(a) - dy * Math.sin(a),
      y: dx * Math.sin(a) + dy * Math.cos(a)
    };
  }

  function hitTest(px, py) {
    // de l'avant vers le fond
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const lp = toLocal(it, px, py);
      if (Math.abs(lp.x) <= it.w / 2 + 6 && Math.abs(lp.y) <= it.h / 2 + 6) {
        return it;
      }
    }
    return null;
  }

  /* ---------------- Interactions souris ---------------- */
  canvas.addEventListener("pointerdown", (e) => {
    const p = canvasPoint(e);
    const hit = hitTest(p.x, p.y);
    if (hit) {
      selectedId = hit.id;
      drag = { id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y };
      canvas.setPointerCapture(e.pointerId);
    } else {
      selectedId = null;
      drag = null;
    }
    render();
    syncPanels();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = canvasPoint(e);
    const it = items.find((x) => x.id === drag.id);
    if (!it) return;
    it.x = Math.max(0, Math.min(canvas.width, p.x - drag.dx));
    it.y = Math.max(0, Math.min(canvas.height, p.y - drag.dy));
    render();
    updatePosLabel();
  });

  function endDrag(e) {
    if (drag) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      drag = null;
      persist();
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // Drag & drop depuis le catalogue
  canvas.addEventListener("dragover", (e) => e.preventDefault());
  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    if (!type || !CATALOG[type]) return;
    const p = canvasPoint(e);
    addItem(type, p.x, p.y);
    persist();
  });

  /* ---------------- Panneau propriétés ---------------- */
  const els = {
    noSel: document.getElementById("noSelection"),
    form: document.getElementById("propForm"),
    name: document.getElementById("propName"),
    color: document.getElementById("propColor"),
    w: document.getElementById("propW"),
    h: document.getElementById("propH"),
    r: document.getElementById("propR"),
    wLabel: document.getElementById("propWLabel"),
    hLabel: document.getElementById("propHLabel"),
    rLabel: document.getElementById("propRLabel"),
    pos: document.getElementById("propPos"),
    count: document.getElementById("itemCount"),
    summary: document.getElementById("summaryList")
  };

  function updatePosLabel() {
    const s = getSelected();
    if (s) els.pos.textContent = `${Math.round(s.x)}, ${Math.round(s.y)}`;
  }

  function syncPanels() {
    const s = getSelected();
    if (!s) {
      els.noSel.hidden = false;
      els.form.hidden = true;
    } else {
      els.noSel.hidden = true;
      els.form.hidden = false;
      els.name.value = s.name;
      els.color.value = normalizeColor(s.color);
      els.w.value = s.w; els.wLabel.textContent = `${s.w}px`;
      els.h.value = s.h; els.hLabel.textContent = `${s.h}px`;
      els.r.value = s.rot; els.rLabel.textContent = `${s.rot}°`;
      updatePosLabel();
    }
    els.count.textContent = `${items.length} élément${items.length > 1 ? "s" : ""}`;
    buildSummary();
    persist();
  }

  function normalizeColor(c) {
    if (/^#/.test(c)) return c.length === 4
      ? "#" + c.slice(1).split("").map((x) => x + x).join("")
      : c;
    // rgb(...) -> hex approximatif
    const m = c.match(/\d+/g);
    if (m) return "#" + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, "0")).join("");
    return "#888888";
  }

  function buildSummary() {
    const counts = {};
    items.forEach((it) => {
      counts[it.type] = counts[it.type] || { n: 0, color: it.color };
      counts[it.type].n++;
    });
    els.summary.innerHTML = "";
    const keys = Object.keys(counts);
    if (!keys.length) {
      els.summary.innerHTML = '<li style="justify-content:center;color:var(--muted)">Setup vide</li>';
      return;
    }
    keys.forEach((type) => {
      const def = CATALOG[type];
      const li = document.createElement("li");
      li.innerHTML =
        `<span class="dot" style="background:${counts[type].color}"></span>` +
        `<span>${def.emoji} ${def.label}</span>` +
        `<span class="count">×${counts[type].n}</span>`;
      els.summary.appendChild(li);
    });
  }

  els.name.addEventListener("input", () => { const s = getSelected(); if (s) { s.name = els.name.value; persist(); } });
  els.color.addEventListener("input", () => { const s = getSelected(); if (s) { s.color = els.color.value; render(); buildSummary(); persist(); } });
  els.w.addEventListener("input", () => { const s = getSelected(); if (s) { s.w = +els.w.value; els.wLabel.textContent = `${s.w}px`; render(); persist(); } });
  els.h.addEventListener("input", () => { const s = getSelected(); if (s) { s.h = +els.h.value; els.hLabel.textContent = `${s.h}px`; render(); persist(); } });
  els.r.addEventListener("input", () => { const s = getSelected(); if (s) { s.rot = +els.r.value; els.rLabel.textContent = `${s.rot}°`; render(); persist(); } });

  /* ---------------- Barre d'outils ---------------- */
  document.getElementById("btnGrid").addEventListener("click", () => { showGrid = !showGrid; render(); });
  document.getElementById("btnFront").addEventListener("click", bringToFront);
  document.getElementById("btnBack").addEventListener("click", sendToBack);
  document.getElementById("btnRotate").addEventListener("click", () => rotateSelected(15));
  document.getElementById("btnDuplicate").addEventListener("click", duplicateSelected);
  document.getElementById("btnDelete").addEventListener("click", deleteSelected);

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
    if (e.key === "d" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); duplicateSelected(); }
    if (e.key === "r") rotateSelected(15);
  });

  /* ---------------- Persistance & presets ---------------- */
  function serialize() {
    return JSON.stringify({ version: 1, nextId, items }, null, 2);
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, serialize()); } catch (_) {}
  }

  function loadFromData(data) {
    if (!data || !Array.isArray(data.items)) return false;
    items = data.items.filter((it) => CATALOG[it.type]);
    nextId = data.nextId || (items.reduce((m, it) => Math.max(m, it.id), 0) + 1);
    selectedId = null;
    render();
    syncPanels();
    return true;
  }

  document.getElementById("btnSave").addEventListener("click", () => {
    persist();
    flash("💾 Setup sauvegardé dans le navigateur.");
  });

  document.getElementById("btnLoad").addEventListener("click", () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && loadFromData(JSON.parse(raw))) flash("📂 Setup chargé.");
    else flash("Aucune sauvegarde trouvée.");
  });

  document.getElementById("btnClear").addEventListener("click", () => {
    if (!items.length || confirm("Vider le plan ?")) {
      items = []; selectedId = null; render(); syncPanels();
    }
  });

  document.getElementById("btnExportJson").addEventListener("click", () => {
    download("mon-setup.json", serialize(), "application/json");
  });

  document.getElementById("btnExportPng").addEventListener("click", () => {
    const prev = selectedId;
    selectedId = null; render(); // exporter sans cadre de sélection
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "mon-setup.png"; a.click();
      URL.revokeObjectURL(url);
      selectedId = prev; render();
    });
  });

  const fileInput = document.getElementById("fileImport");
  document.getElementById("btnImportJson").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const f = fileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (loadFromData(JSON.parse(reader.result))) flash("⬆️ Setup importé.");
        else flash("Fichier invalide.");
      } catch (_) { flash("Fichier JSON illisible."); }
    };
    reader.readAsText(f);
    fileInput.value = "";
  });

  /* ---------------- Presets ---------------- */
  const PRESETS = {
    gaming: [
      ["bureau", 550, 470, 0], ["tour", 820, 470, 0],
      ["ecran", 460, 360, 0], ["clavier", 460, 470, 0],
      ["tapis", 470, 470, 0], ["souris", 600, 470, 0],
      ["casque", 250, 360, 0], ["manette", 660, 540, 0],
      ["chaise", 460, 650, 0]
    ],
    bureautique: [
      ["bureau", 550, 470, 0], ["ordi_portable", 470, 380, 0],
      ["souris", 640, 450, 0], ["lampe", 280, 360, 0],
      ["chaise", 460, 650, 0]
    ],
    streaming: [
      ["bureau", 550, 470, 0], ["tour", 820, 470, 0],
      ["ecran", 400, 360, 0], ["ecran", 670, 370, 0],
      ["clavier", 470, 480, 0], ["souris", 620, 480, 0], ["tapis", 480, 480, 0],
      ["micro", 280, 380, 0], ["casque", 270, 520, 0],
      ["webcam", 470, 280, 0], ["lampe", 760, 320, 0], ["chaise", 470, 650, 0]
    ],
    dual: [
      ["bureau", 550, 470, 0],
      ["ecran", 400, 360, -8], ["ecran", 700, 360, 8],
      ["clavier", 550, 480, 0], ["tapis", 560, 480, 0],
      ["souris", 700, 480, 0], ["tour", 850, 470, 0], ["chaise", 550, 650, 0]
    ]
  };

  document.getElementById("presetSelect").addEventListener("change", (e) => {
    const key = e.target.value;
    if (!key || !PRESETS[key]) return;
    if (items.length && !confirm("Remplacer le setup actuel par le preset ?")) {
      e.target.value = ""; return;
    }
    items = [];
    nextId = 1;
    PRESETS[key].forEach(([type, x, y, rot]) => {
      const def = CATALOG[type];
      items.push({ id: nextId++, type, name: def.label, x, y, w: def.w, h: def.h, rot: rot || 0, color: def.color });
    });
    selectedId = null;
    render();
    syncPanels();
    e.target.value = "";
    flash("Preset appliqué — déplacez les éléments à votre guise.");
  });

  /* ---------------- Utilitaires ---------------- */
  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  let flashTimer = null;
  function flash(msg) {
    let el = document.getElementById("flashMsg");
    if (!el) {
      el = document.createElement("div");
      el.id = "flashMsg";
      el.style.cssText =
        "position:fixed;bottom:54px;left:50%;transform:translateX(-50%);" +
        "background:#232a47;color:#e8ebf5;border:1px solid #5b8cff;" +
        "padding:10px 16px;border-radius:10px;font-size:13px;z-index:50;" +
        "box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .3s;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { el.style.opacity = "0"; }, 2200);
  }

  /* ---------------- Démarrage ---------------- */
  buildCatalog();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { loadFromData(JSON.parse(saved)); } catch (_) { render(); syncPanels(); }
  } else {
    render();
    syncPanels();
  }
})();

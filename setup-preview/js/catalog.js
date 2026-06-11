/*
 * Catalogue des éléments de setup.
 * Chaque type définit : un emoji (pour le catalogue), une couleur par défaut,
 * des dimensions par défaut (en pixels du plan) et une fonction de dessin
 * "draw(ctx, w, h, color)" appelée dans le repère local de l'élément (centré).
 */
(function (global) {
  "use strict";

  // Utilitaire : rectangle à coins arrondis.
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shade(hex, amount) {
    // amount: -1..1 (négatif = plus sombre)
    const c = hex.replace("#", "");
    const num = parseInt(c.length === 3 ? c.split("").map(x => x + x).join("") : c, 16);
    let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    const t = amount < 0 ? 0 : 255;
    const p = Math.abs(amount);
    r = Math.round((t - r) * p) + r;
    g = Math.round((t - g) * p) + g;
    b = Math.round((t - b) * p) + b;
    return `rgb(${r},${g},${b})`;
  }

  const CATALOG = {
    bureau: {
      label: "Bureau", emoji: "🪑", color: "#7a5230", w: 420, h: 200,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h, 10);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 3; ctx.stroke();
        // veinage léger
        ctx.strokeStyle = shade(color, -0.12); ctx.lineWidth = 1;
        for (let i = -h / 2 + 18; i < h / 2; i += 22) {
          ctx.beginPath(); ctx.moveTo(-w / 2 + 8, i); ctx.lineTo(w / 2 - 8, i); ctx.stroke();
        }
      }
    },
    tour: {
      label: "Tour PC", emoji: "🖥️", color: "#2b2f3a", w: 90, h: 200,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h, 8);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 2; ctx.stroke();
        // panneau vitré + RGB
        roundRect(ctx, -w / 2 + 8, -h / 2 + 10, w - 16, h - 20, 5);
        ctx.fillStyle = "rgba(120,160,255,0.18)"; ctx.fill();
        const cols = ["#ff4d6d", "#ffd166", "#06d6a0", "#5b8cff"];
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = cols[i];
          ctx.beginPath();
          ctx.arc(0, -h / 2 + 30 + i * 18, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    ecran: {
      label: "Écran", emoji: "🖵", color: "#15171c", w: 260, h: 150,
      draw(ctx, w, h, color) {
        const stand = 18;
        // pied
        ctx.fillStyle = shade(color, 0.1);
        roundRect(ctx, -30, h / 2 - stand, 60, stand, 4); ctx.fill();
        roundRect(ctx, -6, h / 2 - stand - 14, 12, 16, 2); ctx.fill();
        // cadre
        roundRect(ctx, -w / 2, -h / 2, w, h - stand, 8);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, 0.3); ctx.lineWidth = 2; ctx.stroke();
        // dalle
        roundRect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - stand - 16, 4);
        const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        g.addColorStop(0, "#1e3a8a"); g.addColorStop(1, "#0ea5e9");
        ctx.fillStyle = g; ctx.fill();
      }
    },
    clavier: {
      label: "Clavier", emoji: "⌨️", color: "#22252e", w: 200, h: 70,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h, 6);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = shade(color, 0.25);
        const padX = 10, padY = 10, cols = 12, rows = 4;
        const kw = (w - padX * 2) / cols, kh = (h - padY * 2) / rows;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            roundRect(ctx, -w / 2 + padX + c * kw + 1, -h / 2 + padY + r * kh + 1, kw - 2, kh - 2, 2);
            ctx.fill();
          }
      }
    },
    souris: {
      label: "Souris", emoji: "🖱️", color: "#262a35", w: 44, h: 70,
      draw(ctx, w, h, color) {
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -h / 2 + 6); ctx.lineTo(0, -2);
        ctx.strokeStyle = shade(color, 0.3); ctx.stroke();
        ctx.fillStyle = "#5b8cff";
        ctx.fillRect(-3, -6, 6, 10);
      }
    },
    tapis: {
      label: "Tapis", emoji: "🟦", color: "#1a1d28", w: 300, h: 120,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h, 8);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = "#5b8cff"; ctx.lineWidth = 3; ctx.stroke();
      }
    },
    casque: {
      label: "Casque", emoji: "🎧", color: "#20232c", w: 90, h: 100,
      draw(ctx, w, h, color) {
        ctx.lineWidth = 10; ctx.strokeStyle = color;
        ctx.beginPath(); ctx.arc(0, 0, w / 2 - 6, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = color;
        roundRect(ctx, -w / 2, -6, 16, h / 2, 6); ctx.fill();
        roundRect(ctx, w / 2 - 16, -6, 16, h / 2, 6); ctx.fill();
      }
    },
    enceintes: {
      label: "Enceintes", emoji: "🔊", color: "#2a2e38", w: 60, h: 110,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h, 6);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = shade(color, -0.4);
        ctx.beginPath(); ctx.arc(0, -h / 6, w / 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, h / 4, w / 3.2, 0, Math.PI * 2); ctx.fill();
      }
    },
    lampe: {
      label: "Lampe", emoji: "💡", color: "#3a3f4d", w: 70, h: 70,
      draw(ctx, w, h, color) {
        ctx.strokeStyle = color; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-w / 4, h / 2); ctx.lineTo(0, -h / 4); ctx.lineTo(w / 3, -h / 4); ctx.stroke();
        const g = ctx.createRadialGradient(w / 4, -h / 4, 2, w / 4, -h / 4, w / 2);
        g.addColorStop(0, "#fff7c2"); g.addColorStop(1, "rgba(255,230,120,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 4, -h / 4, w / 2, 0, Math.PI * 2); ctx.fill();
      }
    },
    webcam: {
      label: "Webcam", emoji: "📷", color: "#1f2229", w: 60, h: 40,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h, 8);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, h / 3, 0, Math.PI * 2);
        ctx.fillStyle = "#0ea5e9"; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, h / 7, 0, Math.PI * 2);
        ctx.fillStyle = "#04263b"; ctx.fill();
      }
    },
    micro: {
      label: "Micro", emoji: "🎙️", color: "#33373f", w: 50, h: 110,
      draw(ctx, w, h, color) {
        ctx.fillStyle = shade(color, -0.2);
        roundRect(ctx, -4, 0, 8, h / 2, 2); ctx.fill();
        roundRect(ctx, -w / 3, h / 2 - 6, w / 1.5, 8, 3); ctx.fill();
        roundRect(ctx, -w / 2, -h / 2, w, h / 1.6, w / 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, 0.25); ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = shade(color, -0.3);
        for (let i = -w / 2 + 6; i < w / 2; i += 6) {
          ctx.beginPath(); ctx.moveTo(i, -h / 2 + 6); ctx.lineTo(i, -h / 2 + h / 1.6 - 6); ctx.stroke();
        }
      }
    },
    chaise: {
      label: "Chaise", emoji: "💺", color: "#23262f", w: 150, h: 160,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h * 0.62, 14);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = "#ff4d6d"; ctx.lineWidth = 3; ctx.stroke();
        roundRect(ctx, -w / 2.4, h / 2 - h * 0.32, w / 1.2, h * 0.32, 12);
        ctx.fillStyle = shade(color, 0.08); ctx.fill();
        ctx.strokeStyle = "#ff4d6d"; ctx.stroke();
      }
    },
    manette: {
      label: "Manette", emoji: "🎮", color: "#2a2e38", w: 110, h: 70,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 4, w, h / 1.5, h / 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = shade(color, 0.3);
        ctx.beginPath(); ctx.arc(-w / 4, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(w / 4, 0, 8, 0, Math.PI * 2); ctx.fill();
      }
    },
    ordi_portable: {
      label: "PC portable", emoji: "💻", color: "#20232c", w: 200, h: 140,
      draw(ctx, w, h, color) {
        roundRect(ctx, -w / 2, -h / 2, w, h * 0.62, 6);
        ctx.fillStyle = color; ctx.fill();
        roundRect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h * 0.62 - 16, 3);
        const g = ctx.createLinearGradient(0, -h / 2, 0, 0);
        g.addColorStop(0, "#1e3a8a"); g.addColorStop(1, "#0ea5e9");
        ctx.fillStyle = g; ctx.fill();
        roundRect(ctx, -w / 2 - 6, -h / 2 + h * 0.62, w + 12, h * 0.18, 5);
        ctx.fillStyle = shade(color, 0.12); ctx.fill();
      }
    }
  };

  global.SetupCatalog = { CATALOG, roundRect, shade };
})(window);

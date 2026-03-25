const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('file-input');
const restartBtn = document.getElementById('restart-btn');
const effectLabel = document.getElementById('effect-label');
const keyHints = document.getElementById('key-hints');
const emptyState = document.getElementById('empty-state');
const flash = document.getElementById('flash');

let sourceImage = null;
let activeEffects = new Set();
let labelTimeout = null;
let renderScheduled = false;

const EFFECTS = {
  '1': { name: 'Invert',     fn: fxInvert },
  '2': { name: 'Glitch',     fn: fxGlitch },
  '3': { name: 'Pixelate',   fn: fxPixelate },
  '4': { name: 'Duotone',    fn: fxDuotone },
  '5': { name: 'Mirror',     fn: fxMirror },
  '6': { name: 'Blur',       fn: fxBlur },
  '7': { name: 'Scanlines',  fn: fxScanlines },
  '8': { name: 'Channels',   fn: fxChannels },
  '9': { name: 'Mosaic',     fn: fxMosaic },
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (sourceImage) render();
}
window.addEventListener('resize', resize);
resize();

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      activeEffects.clear();
      updateKeyBadges();
      emptyState.classList.add('hidden');
      keyHints.classList.add('show');
      render();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  fileInput.value = '';
});

restartBtn.addEventListener('click', () => {
  sourceImage = null;
  activeEffects.clear();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  emptyState.classList.remove('hidden');
  keyHints.classList.remove('show');
  updateKeyBadges();
  showLabel('—');
});

document.addEventListener('keydown', e => {
  const k = e.key;
  if (!EFFECTS[k]) return;
  if (!sourceImage) return;

  if (activeEffects.has(k)) {
    activeEffects.delete(k);
    showLabel(`${EFFECTS[k].name} off`);
  } else {
    activeEffects.add(k);
    showLabel(`${EFFECTS[k].name}`);
  }
  updateKeyBadges();
  scheduleRender();
  flashKey(k);
});

function scheduleRender() {
  if (!renderScheduled) {
    renderScheduled = true;
    requestAnimationFrame(() => { renderScheduled = false; render(); });
  }
}

function render() {
  if (!sourceImage) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const scale = Math.max(W / sourceImage.width, H / sourceImage.height);
  const sw = sourceImage.width * scale;
  const sh = sourceImage.height * scale;
  const sx = (W - sw) / 2;
  const sy = (H - sh) / 2;

  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const octx = off.getContext('2d');
  octx.drawImage(sourceImage, sx, sy, sw, sh);

  const order = ['6','3','9','5','4','1','8','2','7'];
  for (const k of order) {
    if (activeEffects.has(k)) {
      EFFECTS[k].fn(octx, W, H);
    }
  }

  ctx.drawImage(off, 0, 0);
}


function fxInvert(ctx, W, H) {
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i]   = 255 - d[i];
    d[i+1] = 255 - d[i+1];
    d[i+2] = 255 - d[i+2];
  }
  ctx.putImageData(id, 0, 0);
}

function fxGlitch(ctx, W, H) {
  const slices = 18 + Math.floor(Math.random() * 14);
  for (let i = 0; i < slices; i++) {
    const y = Math.floor(Math.random() * H);
    const h = 2 + Math.floor(Math.random() * 22);
    const shift = (Math.random() - 0.5) * 80;
    const id = ctx.getImageData(0, y, W, h);
    const shifted = ctx.getImageData(Math.max(0, shift), y, W, h);
    ctx.putImageData(id, shift, y);
    const stripe = ctx.getImageData(0, y, W, h);
    ctx.putImageData(stripe, shift * 0.5, y);
  }
}

function fxPixelate(ctx, W, H) {
  const size = 18;
  for (let y = 0; y < H; y += size) {
    for (let x = 0; x < W; x += size) {
      const bw = Math.min(size, W - x);
      const bh = Math.min(size, H - y);
      const id = ctx.getImageData(x + Math.floor(bw/2), y + Math.floor(bh/2), 1, 1);
      ctx.fillStyle = `rgb(${id.data[0]},${id.data[1]},${id.data[2]})`;
      ctx.fillRect(x, y, bw, bh);
    }
  }
}

function fxDuotone(ctx, W, H) {
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;

  const sr = 15, sg = 10, sb = 60;
  const hr = 255, hg = 200, hb = 80;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    const t = lum / 255;
    d[i]   = Math.round(sr + t * (hr - sr));
    d[i+1] = Math.round(sg + t * (hg - sg));
    d[i+2] = Math.round(sb + t * (hb - sb));
  }
  ctx.putImageData(id, 0, 0);
}

function fxMirror(ctx, W, H) {
  const half = ctx.getImageData(0, 0, Math.floor(W/2), H);
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const tc = tmp.getContext('2d');
  tc.putImageData(half, 0, 0);
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

function fxBlur(ctx, W, H) {
  const tmp = document.createElement('canvas');
  const factor = 0.06;
  tmp.width = Math.max(1, Math.floor(W * factor));
  tmp.height = Math.max(1, Math.floor(H * factor));
  const tc = tmp.getContext('2d');
  tc.drawImage(ctx.canvas, 0, 0, tmp.width, tmp.height);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tmp, 0, 0, W, H);
  ctx.restore();
}

function fxScanlines(ctx, W, H) {
  const spacing = 3;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  for (let y = 0; y < H; y += spacing) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

function fxChannels(ctx, W, H) {
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  const shift = 12;
  const out = new Uint8ClampedArray(d);
  for (let i = 0; i < d.length; i += 4) {
    const px = (i / 4) | 0;
    const x = px % W;
    // red channel: shift right
    const rx = Math.min(W - 1, x + shift);
    const ri = (((i / 4 / W) | 0) * W + rx) * 4;
    out[ri]   = d[i];
    // blue channel: shift left
    const bx = Math.max(0, x - shift);
    const bi = (((i / 4 / W) | 0) * W + bx) * 4;
    out[bi+2] = d[i+2];
  }
  const outId = new ImageData(out, W, H);
  ctx.putImageData(outId, 0, 0);
}

function fxMosaic(ctx, W, H) {
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  const size = 28;
  for (let by = 0; by < H; by += size) {
    for (let bx = 0; bx < W; bx += size) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let y = by; y < Math.min(H, by + size); y++) {
        for (let x = bx; x < Math.min(W, bx + size); x++) {
          const i = (y * W + x) * 4;
          r += d[i]; g += d[i+1]; b += d[i+2]; count++;
        }
      }
      r = r/count|0; g = g/count|0; b = b/count|0;
      const cx = bx + size/2, cy = by + size/2;
      const radius = (size/2) * 0.82;
      ctx.save();
      ctx.fillStyle = `rgb(${r*0.2|0},${g*0.2|0},${b*0.2|0})`;
      ctx.fillRect(bx, by, Math.min(size, W-bx), Math.min(size, H-by));
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
      ctx.restore();
    }
  }
}


function showLabel(text) {
  effectLabel.textContent = text;
  effectLabel.classList.add('show');
  clearTimeout(labelTimeout);
  labelTimeout = setTimeout(() => effectLabel.classList.remove('show'), 1800);
}

function flashKey(k) {
  const badge = document.querySelector(`.key-badge[data-key="${k}"]`);
  if (!badge) return;
  badge.style.background = 'rgba(255,255,255,0.25)';
  setTimeout(() => badge.style.background = '', 120);
}

function updateKeyBadges() {
  document.querySelectorAll('.key-badge').forEach(b => {
    const k = b.dataset.key;
    b.classList.toggle('active', activeEffects.has(k));
  });
}
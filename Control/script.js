var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var fileInput = document.getElementById('file-input');
var restartBtn = document.getElementById('restart-btn');
var keyHints = document.getElementById('key-hints');
var emptyDiv = document.getElementById('empty');

var myImage = null;
var activeEffects = [];

// make canvas fill the screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (myImage) drawImage();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// load image from file picker
fileInput.addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      myImage = img;
      activeEffects = [];
      updateBadges();
      emptyDiv.classList.add('hidden');
      keyHints.classList.add('show');
      drawImage();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  fileInput.value = '';
});

// reset button
restartBtn.addEventListener('click', function() {
  activeEffects = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  emptyDiv.classList.remove('hidden');
  keyHints.classList.remove('show');
  updateBadges();
});

// number keys 1-9 toggle effects
document.addEventListener('keydown', function(e) {
  if (!myImage) return;
  var key = e.key;
  if (!['1','2','3','4','5','6','7','8','9'].includes(key)) return;

  if (activeEffects.includes(key)) {
    activeEffects.splice(activeEffects.indexOf(key), 1);
  } else {
    activeEffects.push(key);
  }

  updateBadges();
  drawImage();
});

// draw image cover-fit then apply effects
function drawImage() {
  if (!myImage) return;

  var W = canvas.width;
  var H = canvas.height;

  // cover fit
  var scale = Math.max(W / myImage.width, H / myImage.height);
  var drawW = myImage.width * scale;
  var drawH = myImage.height * scale;
  var drawX = (W - drawW) / 2;
  var drawY = (H - drawH) / 2;

  // draw to offscreen canvas first
  var off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  var octx = off.getContext('2d');
  octx.drawImage(myImage, drawX, drawY, drawW, drawH);

  // apply effects in order
  if (activeEffects.includes('1')) effect1_invert(octx, W, H);
  if (activeEffects.includes('2')) effect2_grayscale(octx, W, H);
  if (activeEffects.includes('3')) effect3_pixelate(octx, W, H);
  if (activeEffects.includes('4')) effect4_flip(octx, W, H);
  if (activeEffects.includes('5')) effect5_mirror(octx, W, H);
  if (activeEffects.includes('6')) effect6_blur(octx, W, H);
  if (activeEffects.includes('7')) effect7_scanlines(octx, W, H);
  if (activeEffects.includes('8')) effect8_brightness(octx, W, H);
  if (activeEffects.includes('9')) effect9_red(octx, W, H);

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(off, 0, 0);
}

// ---- EFFECTS ----

// 1 - invert all colors
function effect1_invert(octx, W, H) {
  var data = octx.getImageData(0, 0, W, H);
  var p = data.data;
  for (var i = 0; i < p.length; i += 4) {
    p[i]     = 255 - p[i];
    p[i + 1] = 255 - p[i + 1];
    p[i + 2] = 255 - p[i + 2];
  }
  octx.putImageData(data, 0, 0);
}

// 2 - grayscale
function effect2_grayscale(octx, W, H) {
  var data = octx.getImageData(0, 0, W, H);
  var p = data.data;
  for (var i = 0; i < p.length; i += 4) {
    var avg = (p[i] + p[i + 1] + p[i + 2]) / 3;
    p[i]     = avg;
    p[i + 1] = avg;
    p[i + 2] = avg;
  }
  octx.putImageData(data, 0, 0);
}

// 3 - pixelate
function effect3_pixelate(octx, W, H) {
  var blockSize = 20;
  for (var y = 0; y < H; y += blockSize) {
    for (var x = 0; x < W; x += blockSize) {
      var pixel = octx.getImageData(x, y, 1, 1).data;
      octx.fillStyle = 'rgb(' + pixel[0] + ',' + pixel[1] + ',' + pixel[2] + ')';
      octx.fillRect(x, y, blockSize, blockSize);
    }
  }
}

// 4 - flip upside down
function effect4_flip(octx, W, H) {
  var snapshot = octx.getImageData(0, 0, W, H);
  octx.save();
  octx.translate(0, H);
  octx.scale(1, -1);
  octx.putImageData(snapshot, 0, 0);
  octx.restore();
}

// 5 - mirror left side onto right
function effect5_mirror(octx, W, H) {
  var half = octx.getImageData(0, 0, Math.floor(W / 2), H);
  var tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  var tc = tmp.getContext('2d');
  tc.putImageData(half, 0, 0);
  octx.save();
  octx.translate(W, 0);
  octx.scale(-1, 1);
  octx.drawImage(tmp, 0, 0);
  octx.restore();
}

// 6 - blur (shrink then stretch back up)
function effect6_blur(octx, W, H) {
  var small = document.createElement('canvas');
  small.width = Math.floor(W * 0.05);
  small.height = Math.floor(H * 0.05);
  var sc = small.getContext('2d');
  sc.drawImage(octx.canvas, 0, 0, small.width, small.height);
  octx.drawImage(small, 0, 0, W, H);
}

// 7 - scanlines
function effect7_scanlines(octx, W, H) {
  octx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  for (var y = 0; y < H; y += 4) {
    octx.fillRect(0, y, W, 2);
  }
}

// 8 - brighten
function effect8_brightness(octx, W, H) {
  var data = octx.getImageData(0, 0, W, H);
  var p = data.data;
  for (var i = 0; i < p.length; i += 4) {
    p[i]     = Math.min(255, p[i]     + 80);
    p[i + 1] = Math.min(255, p[i + 1] + 80);
    p[i + 2] = Math.min(255, p[i + 2] + 80);
  }
  octx.putImageData(data, 0, 0);
}

// 9 - red tint
function effect9_red(octx, W, H) {
  octx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  octx.fillRect(0, 0, W, H);
}

// ---- HELPERS ----

function updateBadges() {
  var badges = document.querySelectorAll('.key-badge');
  for (var i = 0; i < badges.length; i++) {
    var key = badges[i].getAttribute('data-key');
    if (activeEffects.includes(key)) {
      badges[i].classList.add('active');
    } else {
      badges[i].classList.remove('active');
    }
  }
}
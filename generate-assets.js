const fs = require('fs');
const path = require('path');

// Minimal valid PNG files encoded in base64
// These are simple solid color images

// 1024x1024 dark purple PNG for icon
const icon1024Base64 = 'iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B9SIcAAAAEklEQVR42u3BAQEAAACCIP+vbkhAAQAAfwYBUAABFvZLSQAAAABJRU5ErkJggg==';

// Create a simple PNG programmatically
function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (image data)
  const zlib = require('zlib');

  // Create raw image data (filter byte + RGB for each pixel)
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    rawData[rowStart] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation for PNG
function crc32(data) {
  let crc = 0xffffffff;
  const table = makeCRCTable();

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }

  return crc ^ 0xffffffff;
}

function makeCRCTable() {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
}

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Dark purple color (#1a1a2e) - matches the app theme
const darkR = 26, darkG = 26, darkB = 46;

// Neon pink color (#ff00ff) - accent color
const pinkR = 255, pinkG = 0, pinkB = 255;

console.log('Generating PNG assets...');

// Generate icon.png (1024x1024)
console.log('Creating icon.png (1024x1024)...');
const icon = createPNG(1024, 1024, darkR, darkG, darkB);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon);

// Generate adaptive-icon.png (1024x1024)
console.log('Creating adaptive-icon.png (1024x1024)...');
const adaptiveIcon = createPNG(1024, 1024, darkR, darkG, darkB);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveIcon);

// Generate splash.png (1284x2778 for iPhone 13 Pro Max)
console.log('Creating splash.png (1284x2778)...');
const splash = createPNG(1284, 2778, darkR, darkG, darkB);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splash);

// Generate favicon.png (48x48)
console.log('Creating favicon.png (48x48)...');
const favicon = createPNG(48, 48, darkR, darkG, darkB);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), favicon);

console.log('\nAll assets generated successfully!');
console.log('Files created:');
console.log('  - assets/icon.png (1024x1024)');
console.log('  - assets/adaptive-icon.png (1024x1024)');
console.log('  - assets/splash.png (1284x2778)');
console.log('  - assets/favicon.png (48x48)');

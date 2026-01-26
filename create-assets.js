// Minimal valid PNG - 1x1 pixel dark purple (#1a1a2e)
// This is a tiny valid PNG that we'll use as a base
const fs = require('fs');
const path = require('path');

// Pre-generated minimal 1x1 dark PNG (expanded to needed sizes via PNG libraries isn't possible without deps)
// Instead, let's create proper sized PNGs using native zlib

const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw pixel data
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const px = row + 1 + x * 3;
      raw[px] = r; raw[px + 1] = g; raw[px + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  // CRC32
  const crcTable = (() => {
    const t = new Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    return t;
  })();

  const crc32 = (buf) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  };

  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crcBuf]);
  };

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const dir = path.join(__dirname, 'assets');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// Theme color: dark purple #1a1a2e
const R = 26, G = 26, B = 46;

console.log('Creating assets...');

fs.writeFileSync(path.join(dir, 'icon.png'), createPNG(1024, 1024, R, G, B));
console.log('✓ icon.png');

fs.writeFileSync(path.join(dir, 'adaptive-icon.png'), createPNG(1024, 1024, R, G, B));
console.log('✓ adaptive-icon.png');

fs.writeFileSync(path.join(dir, 'splash.png'), createPNG(1284, 2778, R, G, B));
console.log('✓ splash.png');

fs.writeFileSync(path.join(dir, 'favicon.png'), createPNG(48, 48, R, G, B));
console.log('✓ favicon.png');

console.log('\nDone! All PNG files created successfully.');

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

// Cache directory for downloaded audio
const CACHE_DIR = path.join(__dirname, 'audio_cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Track downloads in progress to prevent race conditions
const downloadsInProgress = new Map(); // videoId -> Promise

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

// Helper function to download a video with retries and fallbacks
const downloadVideo = async (videoId, cachedFile) => {
  const tempFile = path.join(CACHE_DIR, `${videoId}_temp`);

  // Try different strategies in order
  const strategies = [
    // Strategy 1: Direct m4a with deno runtime
    `yt-dlp -x --audio-format mp3 --audio-quality 5 -o "${tempFile}.%(ext)s" --no-playlist --extractor-args "youtube:player_client=ios" "https://www.youtube.com/watch?v=${videoId}"`,
    // Strategy 2: Use android client (often works better)
    `yt-dlp -x --audio-format mp3 --audio-quality 5 -o "${tempFile}.%(ext)s" --no-playlist --extractor-args "youtube:player_client=android" "https://www.youtube.com/watch?v=${videoId}"`,
    // Strategy 3: Basic download without conversion
    `yt-dlp -f "ba[ext=m4a]/ba" -o "${tempFile}.%(ext)s" --no-playlist "https://www.youtube.com/watch?v=${videoId}"`,
  ];

  let lastError = null;

  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`  Strategy ${i + 1}...`);
      await execAsync(strategies[i], { timeout: 120000 });

      // Find the downloaded file
      const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith(`${videoId}_temp`));
      if (files.length > 0) {
        const downloadedFile = path.join(CACHE_DIR, files[0]);
        const ext = path.extname(files[0]);
        const finalFile = cachedFile.replace('.m4a', ext);
        fs.renameSync(downloadedFile, finalFile);

        // Update cached file path if extension changed
        if (ext !== '.m4a' && fs.existsSync(finalFile)) {
          fs.renameSync(finalFile, cachedFile);
        }
      }

      if (fs.existsSync(cachedFile)) {
        return; // Success!
      }

      // Check for any file with this videoId
      const anyFile = fs.readdirSync(CACHE_DIR).find(f => f.startsWith(videoId) && !f.includes('_temp'));
      if (anyFile) {
        const srcFile = path.join(CACHE_DIR, anyFile);
        if (srcFile !== cachedFile) {
          fs.renameSync(srcFile, cachedFile);
        }
        return;
      }
    } catch (e) {
      lastError = e;
      console.log(`  Strategy ${i + 1} failed: ${e.message.split('\n')[0]}`);
      // Cleanup temp files before trying next strategy
      try {
        const tempFiles = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith(`${videoId}_temp`));
        tempFiles.forEach(f => fs.unlinkSync(path.join(CACHE_DIR, f)));
      } catch {}
    }
  }

  throw lastError || new Error('All download strategies failed');
};

// Download audio file to cache and return it
app.get('/download/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const cachedFile = path.join(CACHE_DIR, `${videoId}.m4a`);

  // Check if already cached (any format)
  const existingFile = fs.readdirSync(CACHE_DIR).find(f => f.startsWith(videoId) && !f.includes('_temp'));
  if (existingFile) {
    const filePath = path.join(CACHE_DIR, existingFile);
    console.log('Serving cached: ' + videoId);
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${videoId}.m4a"`);
    return fs.createReadStream(filePath).pipe(res);
  }

  try {
    // Check if download is already in progress
    if (downloadsInProgress.has(videoId)) {
      console.log('Waiting for existing download: ' + videoId);
      await downloadsInProgress.get(videoId);
    } else {
      // Start new download
      console.log('Downloading: ' + videoId);
      const downloadPromise = downloadVideo(videoId, cachedFile);
      downloadsInProgress.set(videoId, downloadPromise);

      try {
        await downloadPromise;
        console.log('Downloaded: ' + videoId);
      } finally {
        downloadsInProgress.delete(videoId);
      }
    }

    // Find and serve the file
    const file = fs.readdirSync(CACHE_DIR).find(f => f.startsWith(videoId) && !f.includes('_temp'));
    if (file) {
      const filePath = path.join(CACHE_DIR, file);
      res.setHeader('Content-Type', 'audio/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${videoId}.m4a"`);
      return fs.createReadStream(filePath).pipe(res);
    } else {
      throw new Error('File not found after download');
    }
  } catch (e) {
    console.error('Download error:', e.message.split('\n')[0]);
    // Cleanup temp files
    try {
      const tempFiles = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith(`${videoId}_temp`));
      tempFiles.forEach(f => {
        try { fs.unlinkSync(path.join(CACHE_DIR, f)); } catch {}
      });
    } catch {}
    res.status(500).json({ error: 'Download failed: ' + e.message.split('\n')[0] });
  }
});

// Pre-download endpoint - queue downloads without waiting
app.post('/preload', async (req, res) => {
  const { videoIds } = req.body;
  if (!Array.isArray(videoIds)) {
    return res.status(400).json({ error: 'videoIds must be an array' });
  }

  console.log(`Preloading ${videoIds.length} videos...`);

  // Start downloads in background (don't await)
  videoIds.forEach(videoId => {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;

    const cachedFile = path.join(CACHE_DIR, `${videoId}.m4a`);
    const existingFile = fs.readdirSync(CACHE_DIR).find(f => f.startsWith(videoId) && !f.includes('_temp'));

    if (!existingFile && !downloadsInProgress.has(videoId)) {
      console.log('Preloading: ' + videoId);
      const downloadPromise = downloadVideo(videoId, cachedFile);
      downloadsInProgress.set(videoId, downloadPromise);

      downloadPromise
        .then(() => console.log('Preloaded: ' + videoId))
        .catch(e => console.log('Preload failed: ' + videoId + ' - ' + e.message.split('\n')[0]))
        .finally(() => downloadsInProgress.delete(videoId));
    }
  });

  res.json({ success: true, message: `Started preloading ${videoIds.length} videos` });
});

// Check which videos are cached
app.post('/status', (req, res) => {
  const { videoIds } = req.body;
  if (!Array.isArray(videoIds)) {
    return res.status(400).json({ error: 'videoIds must be an array' });
  }

  const status = {};
  videoIds.forEach(videoId => {
    const existingFile = fs.readdirSync(CACHE_DIR).find(f => f.startsWith(videoId) && !f.includes('_temp'));
    const inProgress = downloadsInProgress.has(videoId);
    status[videoId] = existingFile ? 'cached' : (inProgress ? 'downloading' : 'pending');
  });

  res.json({ status });
});

// Clear cache endpoint
app.delete('/cache', (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    files.forEach(file => fs.unlinkSync(path.join(CACHE_DIR, file)));
    console.log('Cache cleared');
    res.json({ success: true, message: 'Cache cleared' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List cached files
app.get('/cache', (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    res.json({ files, inProgress: Array.from(downloadsInProgress.keys()) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
========================================
  Song Guess Server - port ${PORT}
========================================
Endpoints:
  GET  /download/:videoId - Download audio
  POST /preload           - Pre-download videos
  POST /status            - Check cache status
  GET  /cache             - List cached files
  DELETE /cache           - Clear cache
  `);
});

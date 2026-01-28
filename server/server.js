const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

// Cache directory for downloaded audio
const CACHE_DIR = path.join(__dirname, 'audio_cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

app.use(cors());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

// Get audio URL for a YouTube video (for verification)
app.get('/audio/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  console.log('Getting URL for: ' + videoId);
  try {
    const { stdout } = await execAsync(
      'yt-dlp -f "bestaudio[ext=m4a]/bestaudio" -g "https://www.youtube.com/watch?v=' + videoId + '"',
      { timeout: 30000 }
    );
    res.json({ success: true, url: stdout.trim(), videoId: videoId });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

// Download audio file to cache and return it
app.get('/download/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const cachedFile = path.join(CACHE_DIR, `${videoId}.m4a`);

  // Check if already cached
  if (fs.existsSync(cachedFile)) {
    console.log('Serving cached: ' + videoId);
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${videoId}.m4a"`);
    return fs.createReadStream(cachedFile).pipe(res);
  }

  console.log('Downloading: ' + videoId);

  try {
    // Download using yt-dlp directly to file
    const tempFile = path.join(CACHE_DIR, `${videoId}_temp.m4a`);
    await execAsync(
      `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" -o "${tempFile}" --no-playlist "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 120000 }
    );

    // Rename temp to final
    if (fs.existsSync(tempFile)) {
      fs.renameSync(tempFile, cachedFile);
    }

    // Check if file was created (yt-dlp might add extension)
    if (!fs.existsSync(cachedFile)) {
      // Try to find the downloaded file
      const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith(videoId));
      if (files.length > 0) {
        const downloadedFile = path.join(CACHE_DIR, files[0]);
        fs.renameSync(downloadedFile, cachedFile);
      }
    }

    if (fs.existsSync(cachedFile)) {
      console.log('Downloaded and cached: ' + videoId);
      res.setHeader('Content-Type', 'audio/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${videoId}.m4a"`);
      return fs.createReadStream(cachedFile).pipe(res);
    } else {
      throw new Error('Download completed but file not found');
    }
  } catch (e) {
    console.error('Download error:', e.message);
    // Cleanup temp file if exists
    const tempFile = path.join(CACHE_DIR, `${videoId}_temp.m4a`);
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    res.status(500).json({ error: e.message });
  }
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
    res.json({ files });
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
  GET /download/:videoId - Download audio file
  GET /audio/:videoId    - Get audio URL (verify)
  GET /cache             - List cached files
  DELETE /cache          - Clear cache
  `);
});

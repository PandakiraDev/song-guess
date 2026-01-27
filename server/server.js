const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Song Guess Server is running' });
});

// Get audio URL for a YouTube video
app.get('/audio/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID format' });
  }

  console.log(`Getting audio URL for: ${videoId}`);

  try {
    const command = `yt-dlp -f "bestaudio" -g "https://www.youtube.com/watch?v=${videoId}"`;
    const { stdout } = await execAsync(command, { timeout: 30000 });
    const audioUrl = stdout.trim();

    if (!audioUrl) {
      throw new Error('No audio URL returned');
    }

    console.log(`Got audio URL for ${videoId}`);
    res.json({ success: true, url: audioUrl, videoId });

  } catch (error) {
    console.error(`Error: ${error.message}`);

    // Try fallback
    try {
      const fallback = `yt-dlp -f "bestaudio/best" -g "https://www.youtube.com/watch?v=${videoId}"`;
      const { stdout } = await execAsync(fallback, { timeout: 30000 });
      const audioUrl = stdout.trim();

      if (audioUrl) {
        return res.json({ success: true, url: audioUrl, videoId });
      }
    } catch (e) {
      console.error(`Fallback failed: ${e.message}`);
    }

    res.status(500).json({ error: 'Failed to get audio URL', message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
========================================
  Song Guess Server - port ${PORT}
========================================
Użycie lokalne (Termux/komputer).
Test: http://localhost:${PORT}/audio/dQw4w9WgXcQ
  `);
});

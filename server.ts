import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import YTMusic from 'ytmusic-api';

dotenv.config();

const ytmusic = new YTMusic();
let isInitialized = false;

async function ensureYTMusicInitialized() {
  if (!isInitialized) {
    try {
      await ytmusic.initialize();
      isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize YTMusic:', err);
    }
  }
}

async function startServer() {
  await ensureYTMusicInitialized();
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CORS and pre-flight handling
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Support both GET and POST for song search
  app.all('/api/search', async (req, res) => {
    try {
      await ensureYTMusicInitialized();
      const query = (req.body?.query || req.query?.query || req.query?.q || '') as string;
      if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const searchResults = await ytmusic.searchSongs(query.trim());
      const videos = searchResults.slice(0, 20).map((v: any) => ({
        trackId: v.videoId,
        trackName: v.name,
        artistName: v.artist?.name || 'Unknown Artist',
        artworkUrl100: v.thumbnails?.[v.thumbnails.length - 1]?.url || '',
        youtubeId: v.videoId
      }));

      res.json({ results: videos });
    } catch (error: any) {
      console.error('Error searching YouTube:', error);
      res.status(500).json({ error: 'Failed to search YouTube', details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();


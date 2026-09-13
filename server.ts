import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import YTMusic from 'ytmusic-api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ytmusic = new YTMusic();

async function startServer() {
  await ytmusic.initialize();
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.post('/api/search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const searchResults = await ytmusic.searchSongs(query);
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
    // For when built
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();

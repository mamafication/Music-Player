import YTMusic from 'ytmusic-api';

let ytmusic: any = null;

async function getYTMusic() {
  if (!ytmusic) {
    ytmusic = new YTMusic();
    await ytmusic.initialize();
  }
  return ytmusic;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.body?.query || req.query?.query || req.query?.q || '') as string;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const yt = await getYTMusic();
    const searchResults = await yt.searchSongs(query.trim());
    const videos = searchResults.slice(0, 20).map((v: any) => ({
      trackId: v.videoId,
      trackName: v.name,
      artistName: v.artist?.name || 'Unknown Artist',
      artworkUrl100: v.thumbnails?.[v.thumbnails.length - 1]?.url || '',
      youtubeId: v.videoId
    }));

    return res.status(200).json({ results: videos });
  } catch (error: any) {
    console.error('Error in Vercel API search:', error);
    return res.status(500).json({ error: 'Failed to search YouTube', details: error.message });
  }
}

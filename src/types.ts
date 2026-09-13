export interface FavoriteSong {
  userId: string;
  songId: string;
  title: string;
  artist: string;
  albumArtUrl?: string;
  previewUrl?: string;
  createdAt: number;
}

export interface SongResult {
  trackId: string;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  youtubeId?: string;
}

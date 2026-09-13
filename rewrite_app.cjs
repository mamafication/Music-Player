const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove auth imports
app = app.replace("import { db, auth } from './firebase';", "import { db } from './firebase';");
app = app.replace("import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';\n", "");

// 2. Remove user state
app = app.replace(/const \[user, setUser\] = useState<User \| null>\(null\);\n/, "");

// 3. Update useEffect to use localStorage instead of Firestore for favorites
app = app.replace(/useEffect\(\(\) => \{\n\s*let unsubscribeSnapshot[^]*?\}, \[\]\);/m, `useEffect(() => {
    const localFavs = localStorage.getItem('groove_favorites');
    if (localFavs) {
      try {
        setFavorites(JSON.parse(localFavs));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('groove_favorites', JSON.stringify(favorites));
  }, [favorites]);`);

// 4. Remove login / confirmLogout functions
app = app.replace(/const login = async \(\) => \{[^]*?^\s*\};\n/m, "");
app = app.replace(/const \[showLogoutConfirm, setShowLogoutConfirm\] = useState\(false\);\n\n\s*const confirmLogout = async \(\) => \{[^]*?^\s*\};\n/m, "");

// 5. Update toggleFavorite
const toggleFavoriteRegex = /const toggleFavorite = async \(song: SongResult\) => \{[^]*?^\s*\};\n/m;
app = app.replace(toggleFavoriteRegex, `const toggleFavorite = async (song: SongResult) => {
    const isFav = favorites.find((f) => f.songId === song.trackId);
    if (isFav) {
      setFavorites(favorites.filter((f) => f.songId !== song.trackId));
    } else {
      const favSong: FavoriteSong = {
        userId: 'local',
        songId: song.trackId,
        title: song.trackName,
        artist: song.artistName,
        albumArtUrl: song.artworkUrl100,
        previewUrl: song.youtubeId || song.trackId,
        createdAt: Date.now(),
      };
      setFavorites([favSong, ...favorites]);
    }
  };\n`);

// 6. Remove user UI (Login/Logout buttons)
// First, find the sidebar part where it checks for user
app = app.replace(/\{user \? \([^]*?:\s*\(\s*<button onClick=\{login\}[^]*?<\/button>\s*\)\s*\}/gm, "");

// 7. Remove user requirement for favorites UI rendering
app = app.replace(/\{favorites\.length > 0 && user && \(/g, "{favorites.length > 0 && (");
app = app.replace(/\{!user \? \([^]*?:\s*favorites\.length === 0 \? \(/gm, "{favorites.length === 0 ? (");

// write back
fs.writeFileSync('src/App.tsx', app);

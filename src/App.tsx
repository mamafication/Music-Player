import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, Heart, Music, Loader2, X, LogIn, LogOut, SkipBack, SkipForward, Shuffle, Clock, ChevronDown, PanelLeftClose, PanelLeftOpen, Repeat, Repeat1, ListMusic } from 'lucide-react';
import { db, auth } from './firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, getDocs, setDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firebaseUtils';
import { FavoriteSong, SongResult } from './types';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import YouTube, { YouTubePlayer } from 'react-youtube';

declare global {
  interface Window {
    __firebseRedirectPromise?: Promise<any>;
  }
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const safeParseJson = async (res: Response) => {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const searchYouTube = async (query: string): Promise<SongResult[]> => {
  const cleanQuery = query?.trim();
  if (!cleanQuery) return [];

  try {
    // 1. Try POST /api/search
    const postRes = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: cleanQuery })
    });

    if (postRes.ok) {
      const data = await safeParseJson(postRes);
      if (data?.results && Array.isArray(data.results)) {
        return data.results;
      }
    }

    // 2. Fallback to GET /api/search?q=... (handles servers/proxies that return 405 Method Not Allowed for POST)
    const getRes = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (getRes.ok) {
      const data = await safeParseJson(getRes);
      if (data?.results && Array.isArray(data.results)) {
        return data.results;
      }
    }

    return [];
  } catch (error) {
    console.error('Error fetching from YouTube:', error);
    return [];
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SongResult[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSong[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');
  
  const [searchSort, setSearchSort] = useState<'default' | 'title' | 'artist'>('default');
  const [favSort, setFavSort] = useState<'date' | 'title' | 'artist'>(() => {
    try {
      const saved = localStorage.getItem('groove_fav_sort');
      return (saved as 'date' | 'title' | 'artist') || 'date';
    } catch { return 'date'; }
  });

  const handleFavSortChange = (newSort: 'date' | 'title' | 'artist') => {
    setFavSort(newSort);
    localStorage.setItem('groove_fav_sort', newSort);
  };
  const [isLooping, setIsLooping] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('groove_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('brutal');
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  // Debounced Instant Search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsLoading(true);
      searchYouTube(debouncedQuery).then(results => {
        setSearchResults(results);
      }).catch(console.error).finally(() => {
        setIsLoading(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  // Player State
  const [queue, setQueue] = useState<SongResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const activeSlotRef = useRef<1 | 2>(1);
  activeSlotRef.current = activeSlot;
  
  const [slot1Song, setSlot1Song] = useState<SongResult | null>(null);
  const [slot2Song, setSlot2Song] = useState<SongResult | null>(null);
  const [slot1Player, setSlot1Player] = useState<YouTubePlayer | null>(null);
  const [slot2Player, setSlot2Player] = useState<YouTubePlayer | null>(null);
  const crossfadeTriggeredRef = useRef<boolean>(false);
  
  const activePlayer = activeSlot === 1 ? slot1Player : slot2Player;
  const ytPlayer = activePlayer;


  
  const slot1SongRef = useRef(slot1Song);
  slot1SongRef.current = slot1Song;
  const slot2SongRef = useRef(slot2Song);
  slot2SongRef.current = slot2Song;

  const slot1PlayerRef = useRef(slot1Player);
  slot1PlayerRef.current = slot1Player;
  const slot2PlayerRef = useRef(slot2Player);
  slot2PlayerRef.current = slot2Player;

  const currentSong = queue[currentIndex] || null;

  useEffect(() => {
    if (!currentSong) {
      setSlot1Song(null);
      setSlot2Song(null);
      return;
    }
    // reset crossfade trigger when new song begins
    crossfadeTriggeredRef.current = false;
    
    let nextSlot = activeSlotRef.current;
    
    if (activeSlotRef.current === 1) {
      if (!slot1SongRef.current) {
        setSlot1Song(currentSong);
      } else if (slot1SongRef.current.trackId !== currentSong.trackId) {
        setSlot2Song(currentSong);
        nextSlot = 2;
        if (slot2SongRef.current && slot2SongRef.current.trackId === currentSong.trackId) {
          // Reusing the same song on slot 2, seek and play
          if (slot2PlayerRef.current && typeof slot2PlayerRef.current.seekTo === 'function') {
            slot2PlayerRef.current.seekTo(0, true);
            slot2PlayerRef.current.playVideo();
          }
        }
      } else {
        // Reusing the same song on slot 1, seek and play
        if (slot1PlayerRef.current && typeof slot1PlayerRef.current.seekTo === 'function') {
          slot1PlayerRef.current.seekTo(0, true);
          slot1PlayerRef.current.playVideo();
        }
      }
    } else {
      if (!slot2SongRef.current) {
        setSlot2Song(currentSong);
      } else if (slot2SongRef.current.trackId !== currentSong.trackId) {
        setSlot1Song(currentSong);
        nextSlot = 1;
        if (slot1SongRef.current && slot1SongRef.current.trackId === currentSong.trackId) {
          // Reusing the same song on slot 1, seek and play
          if (slot1PlayerRef.current && typeof slot1PlayerRef.current.seekTo === 'function') {
            slot1PlayerRef.current.seekTo(0, true);
            slot1PlayerRef.current.playVideo();
          }
        }
      } else {
        // Reusing the same song on slot 2, seek and play
        if (slot2PlayerRef.current && typeof slot2PlayerRef.current.seekTo === 'function') {
          slot2PlayerRef.current.seekTo(0, true);
          slot2PlayerRef.current.playVideo();
        }
      }
    }
    
    setActiveSlot(nextSlot);
    setIsPlaying(true);
  }, [currentSong]);



  // Volume crossfader
  useEffect(() => {
    let fadeInterval: NodeJS.Timeout;
    if ((slot1Player || slot2Player) && isPlaying) {
      fadeInterval = setInterval(() => {
        try {
          const outPlayer = activeSlot === 1 ? slot2Player : slot1Player;
          const inPlayer = activeSlot === 1 ? slot1Player : slot2Player;
          
          if (outPlayer && typeof outPlayer.getVolume === 'function') {
             const outVol = outPlayer.getVolume();
             if (outVol > 0) {
               outPlayer.setVolume(Math.max(0, outVol - 2)); // Fade out smoothly
             } else {
               outPlayer.pauseVideo();
             }
          }
          
          if (inPlayer && typeof inPlayer.getVolume === 'function') {
             const inVol = inPlayer.getVolume();
             if (inVol < 100) {
               inPlayer.setVolume(Math.min(100, inVol + 2)); // Fade in smoothly
             }
          }
        } catch (e) {}
      }, 50);
    }
    return () => clearInterval(fadeInterval);
  }, [activeSlot, slot1Player, slot2Player, isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && ytPlayer) {
      interval = setInterval(async () => {
        try {
          if (typeof ytPlayer.getCurrentTime === 'function') {
            const time = await ytPlayer.getCurrentTime();
            const dur = await ytPlayer.getDuration();
            if (time !== undefined) setProgress(time);
            if (dur !== undefined && dur > 0) {
              setDuration(dur);
              // Trigger crossfade 5 seconds before end
              if (dur - time <= 5 && !crossfadeTriggeredRef.current) {
                crossfadeTriggeredRef.current = true;
                handleNextRef.current();
              }
            }
          }
        } catch (e) {}
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ytPlayer]);

  const onPlayerReady = (slot: 1 | 2) => (event: any) => {
    const isActive = activeSlotRef.current === slot;
    event.target.setVolume(isActive ? 100 : 0);
    if (slot === 1) setSlot1Player(event.target);
    else setSlot2Player(event.target);
    
    // Explicitly command play if this is the active slot just mounting/remounting
    if (isActive) {
       event.target.playVideo();
       setIsPlaying(true);
    }
  };

  const onPlayerStateChange = (slot: 1 | 2) => (event: any) => {
    // Only respond to state changes of the ACTIVE slot, otherwise they fight!
    if (activeSlotRef.current !== slot) return;
    try {
      if (event.data === 1) {
        setIsPlaying(true);
        if (event.target.getDuration) setDuration(event.target.getDuration());
      } else if (event.data === 2) {
        setIsPlaying(false);
      } else if (event.data === 0) {
        if (isLooping) {
           event.target.seekTo(0);
           event.target.playVideo();
        } else {
           if (!crossfadeTriggeredRef.current) {
               crossfadeTriggeredRef.current = true;
               handleNextRef.current();
           }
        }
      }
    } catch (e) {
      console.error("Player state change error:", e);
    }
  };

  const handleNextRef = useRef<() => void>(() => {});
  const handleNext = () => {

    if (isShuffle && favorites.length > 0) {
      const favQueue = favorites.map(f => ({
        trackId: f.songId,
        trackName: f.title,
        artistName: f.artist,
        artworkUrl100: f.albumArtUrl || '',
        youtubeId: f.previewUrl || ''
      }));
      setQueue(favQueue);
      setCurrentIndex(Math.floor(Math.random() * favQueue.length));
      return;
    }

    if (queue.length === 0) return;
    
    let nextIdx = currentIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      nextIdx = 0; // loop back
    }
    setCurrentIndex(nextIdx);
  };

  handleNextRef.current = handleNext;
  const handlePrev = () => {
    if (queue.length === 0) return;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    setCurrentIndex(prevIdx);
  };

  const playSong = (song: SongResult, newQueue: SongResult[] = []) => {
    if (newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(s => s.trackId === song.trackId);
      setCurrentIndex(idx !== -1 ? idx : 0);
    } else {
      setQueue([song]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  };

  const togglePlayState = () => {
    try {
      if (!ytPlayer) return;
      
      const isPlayable = (p: any) => {
         return p && typeof p.playVideo === 'function';
      };

      if (!isPlayable(ytPlayer)) return;

      if (isPlaying) {
        if (isPlayable(slot1Player)) slot1Player.pauseVideo();
        if (isPlayable(slot2Player)) slot2Player.pauseVideo();
      } else {
        ytPlayer.playVideo();
        // optionally play the fading out track if we wanted, but resuming only active track is fine
      }
    } catch (e) {}
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const time = parseFloat(e.target.value);
      if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
        ytPlayer.seekTo(time, true);
        setProgress(time);
      }
    } catch (err) {
      // Silently ignore seek errors if iframe is not ready
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let isMounted = true;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      setIsAuthLoading(false);
      setAuthError(null);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!currentUser) {
        setFavorites([]);
        return;
      }

      const favoritesPath = `users/${currentUser.uid}/favorites`;
      const favoritesQuery = query(collection(db, favoritesPath));
      unsubscribeSnapshot = onSnapshot(favoritesQuery, (snapshot) => {
        const favs: FavoriteSong[] = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        } as unknown as FavoriteSong));
        setFavorites(favs.sort((a, b) => b.createdAt - a.createdAt));
      }, (error) => {
        console.error('Favorites listener failed', error);
        setAuthError('Your account is signed in, but favorites could not be loaded.');
        handleFirestoreError(error, OperationType.LIST, favoritesPath);
      });
    }, (error) => {
      console.error('Firebase auth state failed', error);
      if (isMounted) {
        setIsAuthLoading(false);
        setAuthError('Unable to connect to Google sign-in. Check your Firebase configuration and try again.');
      }
    });

    if (!window.__firebseRedirectPromise) {
      window.__firebseRedirectPromise = getRedirectResult(auth).catch((error: any) => {
        if (error?.code !== 'auth/no-auth-event') {
          console.error('Redirect sign-in failed', error);
          if (isMounted) setAuthError('Google sign-in could not be completed. Please try again.');
        }
      });
    }

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      console.error('Login failed', error);
      setAuthError(code === 'auth/unauthorized-domain'
        ? 'This preview domain is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains.'
        : 'Google sign-in failed. Please try again.');
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const query = typeof e === 'string' ? e : searchQuery;
    if (!query.trim()) return;

    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('groove_recent_searches', JSON.stringify(newRecent));
    setSearchQuery(query);
    setIsSearchFocused(false);
    
    // Explicit submit instantly sets the debounced query
    setDebouncedQuery(query);
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newRecent = recentSearches.filter(t => t !== termToRemove);
    setRecentSearches(newRecent);
    localStorage.setItem('groove_recent_searches', JSON.stringify(newRecent));
  };

  const toggleFavorite = async (song: SongResult) => {
    if (!user) return login();

    const isFav = favorites.find((f) => f.songId === song.trackId);
    try {
      if (isFav) {
        const docRef = doc(db, `users/${user.uid}/favorites`, song.trackId);
        await deleteDoc(docRef);
      } else {
        const docRef = doc(db, `users/${user.uid}/favorites`, song.trackId);
        const favSong: FavoriteSong = {
          userId: user.uid,
          songId: song.trackId,
          title: song.trackName,
          artist: song.artistName,
          albumArtUrl: song.artworkUrl100,
          previewUrl: song.youtubeId || song.trackId,
          createdAt: Date.now(),
        };
        await setDoc(docRef, favSong);
        
        // Add to the Playing Next queue if not already present
        setQueue(prev => {
          if (!prev.find(s => s.trackId === song.trackId)) {
            return [...prev, song];
          }
          return prev;
        });
      }
    } catch (error) {
      handleFirestoreError(error, isFav ? OperationType.DELETE : OperationType.CREATE, `users/${user.uid}/favorites`);
    }
  };

  const getSortedResults = () => {
    if (searchSort === 'title') return [...searchResults].sort((a, b) => a.trackName.localeCompare(b.trackName));
    if (searchSort === 'artist') return [...searchResults].sort((a, b) => a.artistName.localeCompare(b.artistName));
    return searchResults;
  };

  const getSortedFavs = () => {
    if (favSort === 'title') return [...favorites].sort((a, b) => a.title.localeCompare(b.title));
    if (favSort === 'artist') return [...favorites].sort((a, b) => a.artist.localeCompare(b.artist));
    return favorites;
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-500/30 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className={cn("bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex-col hidden md:flex shrink-0 transition-all duration-300 relative", isSidebarCollapsed ? "w-20" : "w-64")}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-full flex items-center justify-center text-white dark:text-neutral-900 shadow-lg shadow-black/10 dark:shadow-white/10 shrink-0">
              <Music className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">Music Player</h1>}
          </div>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-7 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 rounded-full p-1 z-10 transition-colors shadow-md"
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => {
              setActiveTab('search');
              searchInputRef.current?.focus();
            }}
            className={cn("w-full flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm", activeTab === 'search' ? "active bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50", isSidebarCollapsed ? "justify-center px-0" : "gap-3")}
            title="Search"
          >
            <Search className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Search</span>}
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={cn("w-full flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm", activeTab === 'favorites' ? "active bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50", isSidebarCollapsed ? "justify-center px-0" : "gap-3")}
            title="Your Favorites"
          >
            <Heart className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Your Favorites</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          {user ? (
            <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center flex-col gap-4" : "gap-3 px-2")}>
              <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0" title={user.displayName || 'User'} />
              {!isSidebarCollapsed ? (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user.displayName || 'User'}</p>
                  </div>
                  <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Sign Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button onClick={login} disabled={isAuthLoading} className={cn("flex items-center justify-center gap-2 bg-white text-pink-500 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors w-full disabled:cursor-wait disabled:opacity-60", isSidebarCollapsed ? "px-0" : "px-4")} title="Sign In">
              {isAuthLoading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <LogIn className="w-4 h-4 shrink-0" />}
              {!isSidebarCollapsed && <span>{isAuthLoading ? 'Checking session…' : 'Sign In'}</span>}
            </button>
          )}
        </div>
      </aside>

        {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-40 md:pb-32 relative flex flex-col">
        {authError && (
          <div role="alert" className="mx-4 mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
            <div className="flex items-start justify-between gap-3">
              <span>{authError}</span>
              <button type="button" onClick={() => setAuthError(null)} className="shrink-0" aria-label="Dismiss authentication error">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-full flex items-center justify-center text-white dark:text-neutral-900">
              <Music className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Music Player</h1>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => {
                 setActiveTab('search');
                 searchInputRef.current?.focus();
               }} 
               className={cn("p-2 rounded-lg", activeTab === 'search' ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400")}
             >
               <Search className="w-5 h-5" />
             </button>
             <button onClick={() => setActiveTab('favorites')} className={cn("p-2 rounded-lg", activeTab === 'favorites' ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400")}>
               <Heart className="w-5 h-5" />
             </button>
             {user ? (
                <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-neutral-600 dark:text-neutral-400">
                  <LogOut className="w-5 h-5" />
                </button>
             ) : (
                <button onClick={login} className="p-2 text-neutral-600 dark:text-neutral-400">
                  <LogIn className="w-5 h-5" />
                </button>
             )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
          <div className={cn("space-y-8", activeTab === 'search' ? "block" : "hidden")}>
              <div className="relative group max-w-2xl z-20 mx-auto">
                <form onSubmit={handleSearch}>
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-600 dark:text-neutral-400 group-focus-within:text-pink-500 dark:group-focus-within:text-pink-300 transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for a song or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="w-full bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700/50 rounded-full py-4 pl-12 pr-24 text-base outline-none focus:bg-neutral-100 dark:bg-neutral-800 focus:border-pink-400/50 focus:ring-4 focus:ring-pink-400/10 transition-all placeholder:text-neutral-500 dark:text-neutral-500 shadow-sm"
                  />
                  
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDebouncedQuery('');
                      }}
                      className="absolute inset-y-0 right-16 px-2 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 transition-colors"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button 
                    type="submit"
                    onClick={(e) => {
                      if (!searchQuery.trim()) {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                      }
                    }}
                    className="absolute inset-y-2 right-2 bg-pink-500 dark:bg-pink-400 hover:bg-pink-600 dark:hover:bg-pink-300 text-white dark:text-white rounded-full px-4 flex items-center justify-center transition-colors shadow-sm"
                    title="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>
                {isSearchFocused && recentSearches.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">Recent Searches</p>
                    {recentSearches.map(term => (
                      <div key={term} className="w-full flex items-center hover:bg-neutral-700/50 transition-colors group">
                        <button 
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSearch(term);
                          }} 
                          className="flex-1 text-left px-4 py-3 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 hover:text-pink-500 dark:hover:text-pink-300"
                        >
                          <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-500" />
                          {term}
                        </button>
                        <button 
                          onMouseDown={(e) => {
                             e.preventDefault();
                             removeRecentSearch(e, term);
                          }}
                          className="p-3 text-neutral-500 dark:text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove from history"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    Search Results
                  </h2>
                  {searchResults.length > 0 && (
                    <div className="relative">
                      <select 
                        value={searchSort}
                        onChange={(e) => setSearchSort(e.target.value as any)}
                        className="appearance-none bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-neutral-500/50"
                      >
                        <option value="default">Best Match</option>
                        <option value="title">Title</option>
                        <option value="artist">Artist</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                </div>
                
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="h-40 flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-500 dark:text-neutral-500">
                    Search for a track to get started
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {getSortedResults().map((song) => (
                      <SongCard 
                        key={`search-${song.trackId}`} 
                        song={song} 
                        isPlaying={isPlaying && currentSong?.trackId === song.trackId}
                        isFavorite={!!favorites.find((f) => f.songId === song.trackId)}
                        onPlay={() => {
                          if (currentSong?.trackId === song.trackId) {
                            togglePlayState();
                          } else {
                            playSong(song, getSortedResults());
                          }
                        }}
                        onFavorite={() => toggleFavorite(song)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          <div className={cn("space-y-8", activeTab === 'favorites' ? "block" : "hidden")}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  Your Favorites
                </h2>
                {favorites.length > 0 && user && (
                  <div className="relative">
                    <select 
                      value={favSort}
                      onChange={(e) => handleFavSortChange(e.target.value as any)}
                      className="appearance-none bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    >
                      <option value="date">Date Added</option>
                      <option value="title">Title</option>
                      <option value="artist">Artist</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>
              
              {!user ? (
                <div className="text-center py-20 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50">
                  <Heart className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400 text-base mb-6">Sign in to save and listen to your favorite tracks.</p>
                  <button onClick={login} className="bg-white text-pink-500 px-8 py-3 rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors shadow-lg">
                    Sign In to Continue
                  </button>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-20 border border-neutral-200 dark:border-neutral-800 border-dashed rounded-3xl">
                  <Music className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-500 text-base">No favorites yet. Search and heart some songs!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getSortedFavs().map((fav) => {
                    const favSong: SongResult = {
                      trackId: fav.songId,
                      trackName: fav.title,
                      artistName: fav.artist,
                      artworkUrl100: fav.albumArtUrl || '',
                      youtubeId: fav.previewUrl || ''
                    };
                    return (
                      <SongCard
                        key={fav.songId}
                        song={favSong}
                        isPlaying={isPlaying && currentSong?.trackId === fav.songId}
                        isFavorite={true}
                        onPlay={() => {
                          if (currentSong?.trackId === fav.songId) {
                            togglePlayState();
                          } else {
                            const sortedFavs = getSortedFavs();
                            const favQueue = sortedFavs.map(f => ({
                              trackId: f.songId,
                              trackName: f.title,
                              artistName: f.artist,
                              artworkUrl100: f.albumArtUrl || '',
                              youtubeId: f.previewUrl || ''
                            }));
                            playSong(favSong, favQueue);
                          }
                        }}
                        onFavorite={() => toggleFavorite(favSong)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
        </div>
      </main>

      {/* Dual Hidden YouTube Players for Crossfading */}
      <div className="hidden">
        {slot1Song && slot1Song.youtubeId && (
          <YouTube
            key={`slot1-${slot1Song.youtubeId}`}
            videoId={slot1Song.youtubeId}
            opts={{ 
              height: '0', 
              width: '0',
              host: 'https://www.youtube.com',
              playerVars: { 
                autoplay: 1, 
                controls: 0, 
                disablekb: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : '',
                enablejsapi: 1
              } 
            }}
            onReady={onPlayerReady(1)}
            onStateChange={onPlayerStateChange(1)}
            onError={(e) => console.error("YouTube Error 1:", e)}
          />
        )}
        {slot2Song && slot2Song.youtubeId && (
          <YouTube
            key={`slot2-${slot2Song.youtubeId}`}
            videoId={slot2Song.youtubeId}
            opts={{ 
              height: '0', 
              width: '0',
              host: 'https://www.youtube.com',
              playerVars: { 
                autoplay: 1, 
                controls: 0, 
                disablekb: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : '',
                enablejsapi: 1
              } 
            }}
            onReady={onPlayerReady(2)}
            onStateChange={onPlayerStateChange(2)}
            onError={(e) => console.error("YouTube Error 2:", e)}
          />
        )}
      </div>

      {/* Bottom Global Player */}
      {currentSong && (
        <div className={cn("fixed bottom-0 left-0 right-0 h-auto md:h-24 py-3 md:py-0 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center px-4 md:px-6 z-50 animate-in slide-in-from-bottom-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-300", isSidebarCollapsed ? "md:left-20" : "md:left-64")}>
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 md:h-full">
            
            {/* Now Playing Info */}
            <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4 w-full md:w-auto md:flex-1 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 shadow-md">
                  <img src={currentSong.artworkUrl100} alt={currentSong.trackName} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-neutral-900 dark:text-white truncate">{currentSong.trackName}</p>
                  <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate">{currentSong.artistName}</p>
                  <div className="font-mono flex items-center gap-1.5 mt-1 text-[9px] text-neutral-500 font-bold tracking-tight opacity-70">
                    <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(currentSong.trackId).format}</span>
                    <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(currentSong.trackId).bitrate}</span>
                  </div>
                </div>
              </div>
              
                            {/* Mobile quick controls */}
              <div className="flex items-center md:hidden gap-2 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsQueueOpen(!isQueueOpen); }}
                  className={cn("p-2 rounded-full transition-colors", isQueueOpen ? "bg-pink-500 text-white dark:bg-pink-400 dark:text-white" : "hover:bg-neutral-200 dark:hover:bg-neutral-800")}
                >
                  <ListMusic className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(currentSong); }}
                  className="p-2 rounded-full transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-800"
                >
                  <Heart className={cn("w-5 h-5", favorites.find(f => f.songId === currentSong.trackId) ? "text-rose-500 fill-current" : "text-neutral-500")} />
                </button>
                <div className="relative flex items-center justify-center">
                  <svg className="absolute w-[46px] h-[46px] -rotate-90 pointer-events-none" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="22" className="stroke-neutral-200 dark:stroke-neutral-700" strokeWidth="2" fill="none" />
                    <circle cx="24" cy="24" r="22" className="stroke-pink-500 dark:stroke-pink-400 transition-all duration-300 ease-linear" strokeWidth="2" fill="none" strokeDasharray={138.2} strokeDashoffset={138.2 - ((progress / (duration || 1)) * 138.2)} strokeLinecap="round" />
                  </svg>
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlayState(); }}
                    className="w-10 h-10 bg-pink-500 dark:bg-pink-400 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-sm relative z-10"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                  </button>
                </div>
              </div>
              
              {/* Desktop Favorite */}
              <button 
                onClick={() => toggleFavorite(currentSong)}
                className="hidden md:flex ml-2 p-2 rounded-full transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-800 shrink-0"
              >
                <Heart className={cn("w-4 h-4", favorites.find(f => f.songId === currentSong.trackId) ? "text-rose-500 fill-current" : "text-neutral-500 dark:text-neutral-500")} />
              </button>
            </div>

            {/* Player Controls */}
            <div className="flex flex-col items-center justify-center w-full md:flex-[2] gap-1.5 md:gap-2">
              <div className="hidden md:flex items-center justify-center gap-6">
                <button 
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={cn("text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 transition-colors", isShuffle && "text-pink-500 dark:text-pink-300")}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <div className="relative flex items-center justify-center">
                  <svg className="absolute w-[46px] h-[46px] -rotate-90 pointer-events-none" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="22" className="stroke-neutral-200 dark:stroke-neutral-700" strokeWidth="2" fill="none" />
                    <circle cx="24" cy="24" r="22" className="stroke-pink-500 dark:stroke-pink-400 transition-all duration-300 ease-linear" strokeWidth="2" fill="none" strokeDasharray={138.2} strokeDashoffset={138.2 - ((progress / (duration || 1)) * 138.2)} strokeLinecap="round" />
                  </svg>
                  <button 
                    onClick={togglePlayState}
                    className="w-10 h-10 bg-pink-500 dark:bg-pink-400 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform relative z-10"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                  </button>
                </div>
                <button 
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn("hover:text-pink-500 dark:hover:text-pink-300 transition-colors", isLooping ? "text-pink-500 dark:text-pink-300" : "text-neutral-600 dark:text-neutral-400")}
                  title="Loop Song"
                >
                  {isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-3 w-full max-w-md">
                <span className="font-mono text-[10px] md:text-[11px] text-neutral-600 dark:text-neutral-400 font-medium w-8 md:w-10 text-right">{formatTime(progress)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-pink-500 dark:[&::-webkit-slider-thumb]:border-pink-300 cursor-pointer"
                />
                <span className="font-mono text-[10px] md:text-[11px] text-neutral-600 dark:text-neutral-400 font-medium w-8 md:w-10 text-left">{formatTime(duration)}</span>
              </div>
            </div>

                        {/* Right Spacing / Extras */}
            <div className="hidden md:flex justify-end items-center gap-4 flex-1 w-full relative">
              <button 
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className={cn("p-2 rounded-lg transition-colors border-2", isQueueOpen ? "bg-pink-500 text-white dark:bg-pink-400 dark:text-white border-transparent" : "text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700")}
                title="Playing Next"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
            
            {/* Queue Panel Overlay (Drawer on Mobile, Popover on Desktop) */}
            {isQueueOpen && (
              <>
                {/* Mobile Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/40 z-[90] md:hidden animate-in fade-in duration-200"
                  onClick={() => setIsQueueOpen(false)}
                />
                <div className="fixed md:absolute inset-y-0 right-0 md:inset-y-auto md:bottom-[calc(100%+0.5rem)] md:right-4 lg:right-6 w-[85vw] max-w-[360px] md:w-96 h-full md:h-auto max-h-full md:max-h-[400px] bg-neutral-50 dark:bg-neutral-900 flex flex-col neo-modal border-l-2 md:border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl z-[100] md:z-50 animate-in slide-in-from-right-16 md:slide-in-from-right-0 md:slide-in-from-bottom-2 fade-in duration-300 md:duration-200 rounded-l-2xl md:rounded-3xl">
                  <div className="p-4 md:p-4 pt-10 md:pt-4 border-b-2 border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
                    <h3 className="font-mono font-bold text-sm uppercase tracking-wider">Playing Next</h3>
                    <button onClick={() => setIsQueueOpen(false)} className="p-1 -mr-1 text-neutral-500 hover:text-pink-500 dark:hover:text-pink-300 transition-colors">
                      <X className="w-6 h-6 md:w-5 md:h-5" />
                    </button>
                  </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {queue.length > 0 ? (
                    <div className="flex flex-col gap-1 mb-6">
                      <div className="px-2 py-1 mb-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Current Queue</div>
                      {queue.map((song, idx) => (
                        <button
                          key={`${song.trackId}-${idx}`}
                          onClick={() => {
                            setCurrentIndex(idx);
                            if (!isPlaying) togglePlayState();
                          }}
                          className={cn(
                            "w-full text-left flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-neutral-200 dark:hover:bg-neutral-800",
                            idx === currentIndex ? "bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800/50" : "border border-transparent"
                          )}
                        >
                          <img src={song.artworkUrl100} className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" alt="" />
                          <div className="min-w-0 flex-1">
                            <p className={cn("font-mono text-xs font-bold truncate", idx === currentIndex ? "text-pink-500 dark:text-pink-300" : "")}>
                              {song.trackName}
                            </p>
                            <p className="font-mono text-[10px] text-neutral-500 truncate">{song.artistName}</p>
                          </div>
                          {idx === currentIndex && <Play className="w-3 h-3 fill-pink-500 dark:fill-pink-300 text-pink-500 dark:text-pink-300 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center text-neutral-500 font-mono space-y-4 mb-4">
                      <ListMusic className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                      <p className="text-sm">Queue is empty</p>
                    </div>
                  )}

                  {user ? (
                    favorites.length > 0 ? (
                      <div className="flex flex-col gap-1 border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-2">
                        <div className="px-2 py-1 mb-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Your Favorites</div>
                        {getSortedFavs().map((f, idx) => {
                          const song: SongResult = {
                            trackId: f.songId,
                            trackName: f.title,
                            artistName: f.artist,
                            artworkUrl100: f.albumArtUrl || '',
                            youtubeId: f.previewUrl || ''
                          };
                          return (
                            <button
                              key={`fav-q-${f.songId}-${idx}`}
                              onClick={() => {
                                playSong(song, getSortedFavs().map(fav => ({
                                  trackId: fav.songId,
                                  trackName: fav.title,
                                  artistName: fav.artist,
                                  artworkUrl100: fav.albumArtUrl || '',
                                  youtubeId: fav.previewUrl || ''
                                })));
                              }}
                              className="w-full text-left flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-transparent"
                            >
                              <img src={song.artworkUrl100} className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" alt="" />
                              <div className="min-w-0 flex-1">
                                <p className="font-mono text-xs font-bold truncate">
                                  {song.trackName}
                                </p>
                                <p className="font-mono text-[10px] text-neutral-500 truncate">{song.artistName}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : queue.length === 0 ? (
                      <div className="p-4 text-center text-neutral-500 font-mono space-y-2">
                        <Heart className="w-6 h-6 mx-auto text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs">No favorites yet.</p>
                      </div>
                    ) : null
                  ) : (
                    <div className="p-6 mt-2 border-t border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center text-neutral-500 font-mono space-y-4">
                      <p className="text-xs">Sign in to see your favorites</p>
                      <button 
                        onClick={login}
                        className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Sign in
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
            
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="neo-modal bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Sign Out</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">Are you sure you want to sign out of Music Player?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-neutral-900 dark:text-white font-medium hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="group bg-neutral-100/50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shrink-0 bg-neutral-200/50 dark:bg-neutral-700/50"></div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-4 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-full w-2/3"></div>
        <div className="h-3 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-full w-1/3"></div>
      </div>
      <div className="w-10 h-10 rounded-full bg-neutral-200/50 dark:bg-neutral-700/50 shrink-0"></div>
    </div>
  );
}


const getTechMeta = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bitrates = ['320 KBPS', '1411 KBPS', '24-BIT', '256 KBPS AAC', 'DSD64'];
  const formats = ['WAV', 'MP3', 'FLAC', 'ALAC', 'AAC', 'AIFF'];
  const sampleRates = ['44.1KHZ', '48KHZ', '96KHZ', '192KHZ'];
  
  return {
    bitrate: bitrates[hash % bitrates.length],
    format: formats[(hash + 3) % formats.length],
    sampleRate: sampleRates[(hash + 7) % sampleRates.length]
  };
};

function SongCard({ 
  song, 
  isPlaying, 
  isFavorite, 
  onPlay, 
  onFavorite 
}: { 
  key?: string;
  song: SongResult; 
  isPlaying: boolean; 
  isFavorite: boolean; 
  onPlay: () => void; 
  onFavorite: () => void | Promise<void>; 
}) {
  return (
    <div onClick={onPlay} className="neo-card cursor-pointer group bg-neutral-100/50 dark:bg-neutral-800/30 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 transition-all duration-300 hover:-rotate-1 hover:scale-[1.02] flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shrink-0">
        <img src={song.artworkUrl100} alt={song.trackName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button 
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
            isPlaying && "opacity-100 bg-neutral-900/40 dark:bg-black/60"
          )}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-neutral-900 dark:text-white" />
          ) : (
            <Play className="w-6 h-6 text-neutral-900 dark:text-white translate-x-0.5" />
          )}
        </button>
        {isPlaying && (
          <div className="absolute bottom-1 right-1 w-4 h-4 flex items-end justify-center gap-0.5">
            <span className="w-0.5 bg-pink-300 h-2 animate-[bounce_1s_infinite]" />
            <span className="w-0.5 bg-pink-300 h-3 animate-[bounce_1s_infinite_0.2s]" />
            <span className="w-0.5 bg-pink-300 h-1.5 animate-[bounce_1s_infinite_0.4s]" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-mono text-base font-medium text-neutral-900 dark:text-white truncate mb-0.5">{song.trackName}</p>
        <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400 truncate">{song.artistName}</p>
        <div className="font-mono flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500 font-bold tracking-tight opacity-70">
          <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(song.trackId).format}</span>
          <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(song.trackId).bitrate}</span>
          <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm hidden sm:inline-block">{getTechMeta(song.trackId).sampleRate}</span>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        className={cn(
          "p-3 rounded-full transition-all duration-300",
          isFavorite 
            ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" 
            : "text-neutral-500 dark:text-neutral-500 hover:text-rose-400 hover:bg-neutral-700"
        )}
      >
        <Heart className={cn("w-5 h-5 transition-transform active:scale-75", isFavorite && "fill-current")} />
      </button>
    </div>
  );
}